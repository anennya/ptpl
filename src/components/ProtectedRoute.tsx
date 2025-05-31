import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";

interface ProtectedRouteProps {
  resource: string;
  action: string;
}

const ProtectedRoute = ({ resource, action }: ProtectedRouteProps) => {
  const { user, loading, hasPermission } = useAuth();
  const [permitted, setPermitted] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setPermitted(false);
        return;
      }
      
      // Admin users automatically have all permissions
      if (user.role === 'admin') {
        setPermitted(true);
        return;
      }
      
      // For non-admin users, check specific permissions
      const isPermitted = await hasPermission(resource, action);
      setPermitted(isPermitted);
    };

    if (!loading) {
      checkPermission();
    }
  }, [user, loading, resource, action, hasPermission]);

  if (loading || permitted === null) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return permitted ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default ProtectedRoute;
