// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  email: string;
  role: 'super_admin' | 'manager' | 'coach' | 'student' | 'guardian';
  firstName: string;
  lastName: string;
  avatar?: string;
  franchiseId?: string;
  permissions: Record<string, boolean>;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const getStoredAuth = (): Pick<AuthState, 'accessToken' | 'refreshToken' | 'user'> => {
  try {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      user: JSON.parse(localStorage.getItem('user') || 'null'),
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
};

const stored = getStoredAuth();

const initialState: AuthState = {
  user: stored.user,
  accessToken: stored.accessToken,
  refreshToken: stored.refreshToken,
  isAuthenticated: !!stored.accessToken,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; tokens: { accessToken: string; refreshToken: string } }>
    ) => {
      const { user, tokens } = action.payload;
      state.user = user;
      state.accessToken = tokens.accessToken;
      state.refreshToken = tokens.refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
  },
});

export const { setCredentials, clearCredentials, updateAccessToken } = authSlice.actions;
export default authSlice.reducer;


