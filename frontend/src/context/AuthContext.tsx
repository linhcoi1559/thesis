'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'LANDLORD' | 'TENANT';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED';
  landlordId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, rememberMe?: boolean) => void;
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
    // Check localStorage then sessionStorage on mount based on current route
    const isAdminRoute = pathname.startsWith('/admin');
    const tKey = isAdminRoute ? 'admin_access_token' : 'tenant_access_token';
    const uKey = isAdminRoute ? 'admin_user' : 'tenant_user';

    const storedToken = localStorage.getItem(tKey) || sessionStorage.getItem(tKey);
    const storedUser = localStorage.getItem(uKey) || sessionStorage.getItem(uKey);

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from storage');
        sessionStorage.removeItem(uKey);
        sessionStorage.removeItem(tKey);
        localStorage.removeItem(uKey);
        localStorage.removeItem(tKey);
      }
    } else {
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, [pathname]);

  const login = (newToken: string, newUser: User, rememberMe?: boolean) => {
    const isLandlord = newUser.role === 'ADMIN' || newUser.role === 'LANDLORD';
    const tKey = isLandlord ? 'admin_access_token' : 'tenant_access_token';
    const uKey = isLandlord ? 'admin_user' : 'tenant_user';

    setToken(newToken);
    setUser(newUser);
    
    if (rememberMe) {
      localStorage.setItem(tKey, newToken);
      localStorage.setItem(uKey, JSON.stringify(newUser));
      sessionStorage.removeItem(tKey);
      sessionStorage.removeItem(uKey);
    } else {
      sessionStorage.setItem(tKey, newToken);
      sessionStorage.setItem(uKey, JSON.stringify(newUser));
      localStorage.removeItem(tKey);
      localStorage.removeItem(uKey);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('admin_access_token');
    sessionStorage.removeItem('admin_user');
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_user');
    
    sessionStorage.removeItem('tenant_access_token');
    sessionStorage.removeItem('tenant_user');
    localStorage.removeItem('tenant_access_token');
    localStorage.removeItem('tenant_user');
    
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
