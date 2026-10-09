import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { authService } from '../services/authService.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password?: string, name?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  firebaseLogin: (email: string, name?: string, provider?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      authService.getMe()
        .then(res => setUser(res.user))
        .catch(() => {
          authService.logout();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string) => {
    const res = await authService.login(email, password);
    setUser(res.user);
  };

  const register = async (email: string, password?: string, name?: string) => {
    const res = await authService.register(email, password, name);
    setUser(res.user);
  };

  const demoLogin = async () => {
    const res = await authService.demoLogin();
    setUser(res.user);
  };

  const firebaseLogin = async (email: string, name?: string, provider?: string) => {
    const res = await authService.firebaseAuth(email, name, provider);
    setUser(res.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, demoLogin, firebaseLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

