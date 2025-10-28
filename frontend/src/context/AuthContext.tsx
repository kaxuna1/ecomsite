import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, AuthResponse, RegisterPayload, LoginPayload } from '../types/product';
import * as authApi from '../api/auth';

interface AuthContextValue {
  // Admin auth (existing)
  token: string | null;
  login: (token: string) => void;
  logout: () => void;

  // User auth (new)
  user: User | null;
  userToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userLogin: (payload: LoginPayload) => Promise<void>;
  userRegister: (payload: RegisterPayload) => Promise<void>;
  userLogout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  login: () => {},
  logout: () => {},
  user: null,
  userToken: null,
  isLoading: true,
  isAuthenticated: false,
  userLogin: async () => {},
  userRegister: async () => {},
  userLogout: () => {},
  refreshUser: async () => {},
});

const ADMIN_TOKEN_KEY = 'luxia-admin-token';
const USER_TOKEN_KEY = 'luxia-user-token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  // Admin auth state (existing)
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem(ADMIN_TOKEN_KEY) : null
  );

  // User auth state (new)
  const [userToken, setUserToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem(USER_TOKEN_KEY) : null
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Admin login (existing)
  const login = (newToken: string) => {
    setToken(newToken);
    window.localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
    navigate('/admin');
  };

  // Admin logout (existing)
  const logout = () => {
    setToken(null);
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    navigate('/admin/login');
  };

  // Fetch current user
  const refreshUser = useCallback(async () => {
    if (!userToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Token is invalid, clear it
      setUserToken(null);
      setUser(null);
      window.localStorage.removeItem(USER_TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  // Auto-fetch user on mount or when token changes
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // User login
  const userLogin = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await authApi.login(payload);
      setUserToken(response.token);
      setUser(response.user);
      window.localStorage.setItem(USER_TOKEN_KEY, response.token);
    } finally {
      setIsLoading(false);
    }
  };

  // User register
  const userRegister = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await authApi.register(payload);
      setUserToken(response.token);
      setUser(response.user);
      window.localStorage.setItem(USER_TOKEN_KEY, response.token);
    } finally {
      setIsLoading(false);
    }
  };

  // User logout
  const userLogout = () => {
    setUserToken(null);
    setUser(null);
    window.localStorage.removeItem(USER_TOKEN_KEY);
    navigate('/');
  };

  const isAuthenticated = !!user && !!userToken;

  const value = useMemo(
    () => ({
      // Admin auth
      token,
      login,
      logout,
      // User auth
      user,
      userToken,
      isLoading,
      isAuthenticated,
      userLogin,
      userRegister,
      userLogout,
      refreshUser,
    }),
    [token, user, userToken, isLoading, isAuthenticated, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
