// src/components/layout/RoleProtectedRoute.tsx
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { RootState } from "../../store";

interface RoleProtectedRouteProps {
  allowedRoles: string[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
}) => {
    const { user } = useSelector((s: RootState) => s.auth);
    const hasAccess = user && allowedRoles.includes(user.role);
    return hasAccess ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default RoleProtectedRoute;