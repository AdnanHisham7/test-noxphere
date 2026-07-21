// src/hooks/useAuth.ts
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { clearCredentials } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, accessToken } = useSelector((s: RootState) => s.auth);

  const logout = () => {
    dispatch(clearCredentials());
    navigate('/login');
  };

  const hasPermission = (permission: string): boolean => {
    return !!user?.permissions?.[permission];
  };

  const hasRole = (...roles: string[]): boolean => {
    return !!user && roles.includes(user.role);
  };

  return { user, isAuthenticated, accessToken, logout, hasPermission, hasRole };
};





