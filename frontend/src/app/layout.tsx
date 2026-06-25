import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Rental SaaS - Smart Boarding House',
  description: 'Smart Boarding House Management System',
};

import { AuthProvider } from '../context/AuthContext';
import { Toaster } from '../components/ui/Toaster';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
