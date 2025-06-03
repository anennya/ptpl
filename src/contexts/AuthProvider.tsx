import { createContext, useState, useEffect, ReactNode } from "react";
import * as authService from "../services/auth";

export interface AuthContextType {
  user: authService.User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasPermission: (resource: string, action: string) => Promise<boolean>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create auth context
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<authService.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First check if we have a valid session
        const session = await authService.getSession();

        if (session && session.user) {
          const currentUser = await authService.getUser();
          setUser(currentUser);
        } else {
          // No valid session
          setUser(null);
        }
      } catch (error) {
        console.error("AuthProvider: Failed to get user:", error);
        // Clear any corrupted session data
        await authService.signOut();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (user) => {
      if (user) {
        // Fetch full user data with organization info
        try {
          const fullUser = await authService.getUser();
          setUser(fullUser);
        } catch (error) {
          console.error("Failed to fetch full user data:", error);
          setUser(user); // Fall back to basic user info
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authService.signIn(email, password);

      if (result.user) {
        // Get the full user data including organization info
        const userData = await authService.getUser();
        setUser(userData);
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (
    email: string,
    password: string,
    name?: string,
  ) => {
    try {
      setLoading(true);
      const result = await authService.signUp(email, password, name);

      if (result.user) {
        const userData = await authService.getUser();
        setUser(userData);
      }
    } catch (error) {
      console.error("Sign up failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const hasPermission = async (
    resource: string,
    action: string,
  ): Promise<boolean> => {
    try {
      if (!user) {
        return false;
      }

      // Admin users always have all permissions
      if (user.role === "admin") {
        return true;
      }

      // Special case for books:view - always allow it for authenticated users
      if (resource === "books" && action === "view") {
        return true;
      }

      return await authService.canPerformAction(resource, action);
    } catch (error) {
      console.error("Permission check failed:", error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
