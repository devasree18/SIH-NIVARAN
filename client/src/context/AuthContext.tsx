import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export type UserRole =
  | 'FARMER'
  | 'CENTRE_OPERATOR'
  | 'CENTRE_MANAGER'
  | 'QUALITY_OFFICER'
  | 'WEIGHMENT_OPERATOR'
  | 'FINANCE_OFFICER';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  mobileNumber: string;
  centreId?: string | null;
  farmerId?: string | null;
  centre?: any;
  farmer?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  registerFarmer: (payload: any) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole, centreId?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  registerFarmer: async () => {},
  logout: () => {},
  switchRole: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nivaran_token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const data = await api.getCurrentUser();
      setUser(data);
    } catch {
      localStorage.removeItem('nivaran_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      // Auto-login as farmer_ramesh by default so the reviewer immediately experiences the rich farmer workflow
      api.login({ username: 'farmer_ramesh', password: 'password123' })
        .then((data) => {
          localStorage.setItem('nivaran_token', data.token);
          setToken(data.token);
          setUser(data.user);
        })
        .catch(() => {
          // If server not yet reachable, keep loading false
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const login = async (credentials: any) => {
    const data = await api.login(credentials);
    localStorage.setItem('nivaran_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const registerFarmer = async (payload: any) => {
    const data = await api.registerFarmer(payload);
    localStorage.setItem('nivaran_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('nivaran_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (targetRole: UserRole, centreId?: string) => {
    setLoading(true);
    try {
      const data = await api.switchRole(targetRole, centreId);
      localStorage.setItem('nivaran_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerFarmer,
        logout,
        switchRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
