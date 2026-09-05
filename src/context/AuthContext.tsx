import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types.js';
import { apiRequest, setApiToken } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await apiRequest<{ user: User }>('/api/auth/me');
      setUser(res.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    // On boot, try to get current session via refresh token cookie
    async function initSession() {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include'
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data.token) {
            setApiToken(data.token);
            await refreshUser();
          }
        }
      } catch (err) {
        console.warn('Initial session check error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });
    setApiToken(res.token);
    setUser(res.user);
  };

  const register = async (payload: any) => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setApiToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setApiToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
