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
  const { hasPermission } = useAuth();
  const [permitted, setPermitted] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const isPermitted = await hasPermission(resource, action);
        setPermitted(isPermitted);
      } catch (error) {
        console.error("Permission check error:", error);
        setPermitted(false);
      }
    };

    checkPermission();
  }, [resource, action, hasPermission]);

  return permitted ? children : fallback;
}
