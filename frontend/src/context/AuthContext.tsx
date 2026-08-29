import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('reachinbox_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('[AuthContext] Failed to fetch current user:', err);
      // If unauthorized/expired token, clear it
      localStorage.removeItem('reachinbox_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Intercept Google OAuth token & Slack callback params on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const slackConnected = urlParams.get('slack_connected');

    let cleaned = false;

    if (token) {
      localStorage.setItem('reachinbox_token', token);
      cleaned = true;
    }

    if (slackConnected) {
      cleaned = true;
    }

    if (cleaned) {
      // Remove query parameters from the address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchUser();
  }, [fetchUser]);

  const login = (token: string) => {
    localStorage.setItem('reachinbox_token', token);
    setLoading(true);
    fetchUser();
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
