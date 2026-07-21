// src/components/layout/ProtectedRoute.tsx
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { RootState } from "../../store";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
