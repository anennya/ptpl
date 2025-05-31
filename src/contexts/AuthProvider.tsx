import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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
  role?: string;
}

interface SessionData {
  user: User;
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    userId: string;
    activeOrganizationId?: string;
  };
  activeOrganizationId?: string;
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
  const session = authClient.useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      if (session.data?.user) {
        const baseUser = session.data.user as User;
        
        // Try to get user's role from active organization membership
        try {
          const activeMemberResponse = await authClient.organization.getActiveMember();
          const memberData = activeMemberResponse as any;
          const userWithRole = {
            ...baseUser,
            role: memberData?.role || memberData?.data?.role || 'member'
          };
          setUser(userWithRole);
        } catch (error) {
          // If we can't get the role, just set the user without role
          console.error("Failed to get user role:", error);
          setUser(baseUser);
        }

        // Check if user has an active organization, if not set one
        const sessionData = session.data as SessionData;
        if (
          !sessionData?.activeOrganizationId &&
          !sessionData?.session?.activeOrganizationId
        ) {
          try {
            const organizations = await authClient.organization.list();

            if (organizations.data && organizations.data.length > 0) {
              const firstOrg = organizations.data[0];
              await authClient.organization.setActive({
                organizationId: firstOrg.id,
              });
              
              // Retry getting the role after setting active organization
              try {
                const activeMemberResponse = await authClient.organization.getActiveMember();
                const memberData = activeMemberResponse as any;
                const userWithRole = {
                  ...baseUser,
                  role: memberData?.role || memberData?.data?.role || 'member'
                };
                setUser(userWithRole);
              } catch (roleError) {
                console.error("Failed to get user role after setting active org:", roleError);
              }
            }
          } catch (error) {
            console.error(
              "AuthProvider: Failed to set active organization:",
              error,
            );
          }
        }
      } else {
        setUser(null);
      }
      setLoading(session.isPending);
    };

    initializeUser();
  }, [session.data, session.isPending, session.error]);

  const value = {
    user,
    loading,
    signIn: authClient.signIn,
    signOut: authClient.signOut,
    hasPermission: async (
      resource: string,
      action: string,
    ): Promise<boolean> => {
      try {
        if (!user) {
          return false;
        }
        
        // Admin users always have all permissions
        if (user.role === 'admin') {
          return true;
        }
        
        // Special case for books:view - always allow it for authenticated users
        if (resource === "books" && action === "view") {
          return true;
        }

        const result = await authClient.organization.hasPermission({
          permissions: { [resource]: [action] },
        });

        // Handle different response types from better-auth
        if (typeof result === "boolean") {
          return result;
        }

        // Handle Data<{ success: boolean }> type
        if (result && typeof result === "object" && "success" in result) {
          return Boolean((result as { success: boolean }).success);
        }

        return false;
      } catch (error) {
        console.error(`Permission check failed for ${resource}:${action}:`, error);
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
