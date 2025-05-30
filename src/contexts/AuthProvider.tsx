import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authClient } from "../lib/auth-client";

// Define types
interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  member?: unknown;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: typeof authClient.signIn;
  signOut: typeof authClient.signOut;
  hasPermission: (resource: string, action: string) => Promise<boolean>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create auth context
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (session && 'user' in session) {
          setUser(session.user as User);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Get active organization and user roles
  useEffect(() => {
    if (!user?.id) return;
    
    authClient.organization
      .getActiveMember()
      .then((member) => {
        setUser((prev) => prev ? ({
          ...prev,
          member: member as unknown,
        }) : null);
      })
      .catch((error) => {
        console.error("Failed to get active member:", error);
      });
  }, [user]);

  const value = {
    user,
    loading,
    signIn: authClient.signIn,
    signOut: authClient.signOut,
    hasPermission: async (resource: string, action: string): Promise<boolean> => {
      try {
        const result = await authClient.organization.hasPermission({
          permissions: { [resource]: [action] },
        });
        
        // Handle different response types from better-auth
        if (typeof result === 'boolean') {
          return result;
        }
        
        // Handle Data<{ success: boolean }> type
        if (result && typeof result === 'object' && 'success' in result) {
          return Boolean((result as { success: boolean }).success);
        }
        
        return false;
      } catch (error) {
        console.error("Permission check failed:", error);
        return false;
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
