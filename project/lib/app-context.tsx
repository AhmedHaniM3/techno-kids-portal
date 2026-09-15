'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextType {
  user: any;
  currentUser: any;
  loading: boolean;
  error: string | null;
  setUser: (user: any) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<any>(null);

  useEffect(() => {
    // Safely load user from localStorage only on the client side
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setUserState(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to load user from localStorage', e);
    }
  }, []);

  const setUser = (newUser: any) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  const logout = () => {
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AppContext.Provider value={{ user, currentUser: user, loading: false, error: null, setUser, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}