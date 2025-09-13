import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { fetchFromApi } from '../utils/api';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, shopDomain: string, accessToken: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      fetchFromApi<{ user: AuthUser }>('/auth/verify')
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await fetchFromApi<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const register = async (email: string, password: string, shopDomain: string, accessToken: string) => {
    try {
      const data = await fetchFromApi<{ token: string; user: AuthUser }>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, shopDomain, accessToken })
      });

      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};