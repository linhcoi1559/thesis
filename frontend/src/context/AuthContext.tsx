'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'LANDLORD' | 'TENANT';
  landlordId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check localStorage on mount based on current route
    const isAdminRoute = pathname.startsWith('/admin');
    const tKey = isAdminRoute ? 'admin_access_token' : 'tenant_access_token';
    const uKey = isAdminRoute ? 'admin_user' : 'tenant_user';

    const storedToken = localStorage.getItem(tKey);
    const storedUser = localStorage.getItem(uKey);

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage');
        localStorage.removeItem(uKey);
        localStorage.removeItem(tKey);
      }
    } else {
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, [pathname]);

  const login = (newToken: string, newUser: User) => {
    const isLandlord = newUser.role === 'ADMIN' || newUser.role === 'LANDLORD';
    const tKey = isLandlord ? 'admin_access_token' : 'tenant_access_token';
    const uKey = isLandlord ? 'admin_user' : 'tenant_user';

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(tKey, newToken);
    localStorage.setItem(uKey, JSON.stringify(newUser));
  };

  const logout = () => {
    const isAdminRoute = pathname.startsWith('/admin');
    const tKey = isAdminRoute ? 'admin_access_token' : 'tenant_access_token';
    const uKey = isAdminRoute ? 'admin_user' : 'tenant_user';

    setToken(null);
    setUser(null);
    localStorage.removeItem(tKey);
    localStorage.removeItem(uKey);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
