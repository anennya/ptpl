import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthProvider";

export default function PermissionGate({
  resource,
  action,
  children,
  fallback = null,
}) {
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
