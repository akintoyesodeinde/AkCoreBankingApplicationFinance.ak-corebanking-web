import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/endpoints';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../services/api';
import type { LoginRequest, RegisterRequest, UserProfileDto } from '../types/banking';

interface AuthContextValue {
  user: UserProfileDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginRequest) => Promise<UserProfileDto>;
  register: (payload: RegisterRequest) => Promise<UserProfileDto>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): UserProfileDto | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfileDto;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<UserProfileDto | null>(() => readStoredUser());
  const [isInitializing, setIsInitializing] = useState<boolean>(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const persistSession = useCallback((accessToken: string, profile: UserProfileDto) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    setToken(accessToken);
    setUser(profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    const activeToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!activeToken) {
      clearSession();
      return;
    }
    const profile = await authApi.me();
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    setUser(profile);
  }, [clearSession]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        if (mounted) setIsInitializing(false);
        return;
      }
      try {
        const profile = await authApi.me();
        if (mounted) {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
          setUser(profile);
        }
      } catch {
        if (mounted) {
          clearSession();
        }
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };
    void init();
    return () => {
      mounted = false;
    };
  }, [clearSession]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await authApi.login(payload);
      persistSession(response.accessToken, response.user);
      return response.user;
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const response = await authApi.register(payload);
      persistSession(response.accessToken, response.user);
      return response.user;
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isInitializing,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
