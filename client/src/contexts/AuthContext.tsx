import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@/types';
import { mockData } from '@/lib/mockData';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('pscchc-user');
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('pscchc-token');
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Try API login first
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token && data.user) {
          setUser(data.user);
          setToken(data.token);
          localStorage.setItem('pscchc-user', JSON.stringify(data.user));
          localStorage.setItem('pscchc-token', data.token);
          return true;
        }
      }
    } catch {
      // API not available, fall back to mock
    }

    // Fallback to mock auth
    const found = mockData.users.find((u) => u.email === email);
    if (found) {
      setUser(found);
      // Generate a simple mock token for WebSocket (server won't validate in dev if secret matches)
      const mockToken = 'mock-token-' + found.id;
      setToken(mockToken);
      localStorage.setItem('pscchc-user', JSON.stringify(found));
      localStorage.setItem('pscchc-token', mockToken);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pscchc-user');
    localStorage.removeItem('pscchc-token');
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role.permissions.includes('*')) return true;
      return user.role.permissions.some(
        (p) => p === permission || (p.endsWith('.*') && permission.startsWith(p.replace('.*', '')))
      );
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
