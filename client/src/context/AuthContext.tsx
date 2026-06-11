'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string;
  coins: number;
  xp: number;
  level: number;
  wins: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, avatarUrl: string) => Promise<void>;
  loginAsGuest: (username: string, avatarUrl: string) => Promise<void>;
  logout: () => void;
  updateLocalUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('nq_token');
    const storedUser = localStorage.getItem('nq_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Proactively fetch updated profile from server
      fetch(`${SERVER_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Session expired");
      })
      .then(data => {
        setUser(data.user);
        localStorage.setItem('nq_user', JSON.stringify(data.user));
      })
      .catch(() => {
        // Clear expired session
        localStorage.removeItem('nq_token');
        localStorage.removeItem('nq_user');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('nq_token', data.token);
    localStorage.setItem('nq_user', JSON.stringify(data.user));
  };

  const register = async (username: string, email: string, password: string, avatarUrl: string) => {
    const res = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, avatarUrl })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('nq_token', data.token);
    localStorage.setItem('nq_user', JSON.stringify(data.user));
  };

  const loginAsGuest = async (username: string, avatarUrl: string) => {
    const res = await fetch(`${SERVER_URL}/api/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, avatarUrl })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Guest signup failed");

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('nq_token', data.token);
    localStorage.setItem('nq_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nq_token');
    localStorage.removeItem('nq_user');
  };

  const updateLocalUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('nq_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginAsGuest, logout, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
