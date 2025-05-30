import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";

const ProtectedRoute = ({ resource, action }) => {
  const { user, loading, hasPermission } = useAuth();
  const [permitted, setPermitted] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkPermission = async () => {
      if (user) {
        const isPermitted = await hasPermission(resource, action);
        setPermitted(isPermitted);
      } else {
        setPermitted(false);
      }
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
