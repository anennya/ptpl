import { useEffect, useState, ReactNode } from "react";
import { useAuth } from "../contexts/AuthProvider";

interface PermissionGateProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGate({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, user } = useAuth();
  const [permitted, setPermitted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const checkPermission = async () => {
      if (!user) {
        setPermitted(false);
        setIsChecking(false);
        return;
      }
      
      try {
        setIsChecking(true);
        
        // Special handling for admin users - always grant permission
        if (user.role === 'admin') {
          if (mounted) {
            setPermitted(true);
            setIsChecking(false);
          }
          return;
        }
        
        // For non-admin users, check specific permissions
        const isPermitted = await hasPermission(resource, action);
        
        if (mounted) {
          setPermitted(isPermitted);
          setIsChecking(false);
        }
      } catch (error) {
        console.error(`Permission check error for ${resource}:${action}:`, error);
        if (mounted) {
          setPermitted(false);
          setIsChecking(false);
        }
      }
    };
    
    checkPermission();
    
    return () => {
      mounted = false;
    };
  }, [resource, action, hasPermission, user]);

  // While checking permissions, render nothing (or could render a loading indicator)
  if (isChecking) {
    return null;
  }
  
  return permitted ? children : fallback;
}
