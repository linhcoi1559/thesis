'use client';

import React, { useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../components/ui/use-toast'; 

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'TENANT') {
        toast({ title: 'Truy cập bị từ chối', description: 'Bạn không có quyền vào trang quản trị.', duration: 3000 });
        router.push('/');
      }
    }
  }, [user, loading, router, toast]);

  const token = (typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : '') || 'demo-token';

  const { on, isConnected } = useSocket({
    token,
    autoConnect: !!token,
  });

  useEffect(() => {
    if (!token) return;

    const unsubscribe = on('new-rent-request', (newRequest: any) => {
      toast({
        title: '🔔 Yêu cầu tư vấn mới!',
        description: `Khách: ${newRequest.name} (${newRequest.phone}) đang quan tâm phòng của bạn.`,
        duration: 8000,
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [on, token, toast]);

  if (loading || !user || user.role === 'TENANT') {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>Đang kiểm tra quyền truy cập...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar Navigation */}
      <aside 
        className="glass-panel" 
        style={{ 
          width: 'var(--sidebar-width)', 
          margin: '20px', 
          marginRight: '0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: '20px',
          height: 'calc(100vh - 40px)'
        }}
      >
        <div style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '40px' }} className="text-gradient">
          Smart Boarding House
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="/admin" style={{ padding: '12px 16px', borderRadius: '8px', fontWeight: '500', transition: 'all 0.2s', background: 'rgba(255,255,255,0.05)' }}>
            Dashboard
          </a>
          <a href="/admin/rooms" style={{ padding: '12px 16px', borderRadius: '8px', fontWeight: '500', transition: 'all 0.2s', opacity: 0.7 }}>
            Quản lý phòng
          </a>
          <a href="/admin/tenants" style={{ padding: '12px 16px', borderRadius: '8px', fontWeight: '500', transition: 'all 0.2s', opacity: 0.7 }}>
            Khách thuê
          </a>
          <a href="/admin/contracts" style={{ padding: '12px 16px', borderRadius: '8px', fontWeight: '500', transition: 'all 0.2s', opacity: 0.7 }}>
            Hợp đồng
          </a>
          <a href="/admin/invoices" style={{ padding: '12px 16px', borderRadius: '8px', fontWeight: '500', transition: 'all 0.2s', opacity: 0.7 }}>
            Hóa đơn
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <header 
          className="glass-header"
          style={{ 
            height: 'var(--header-height)', 
            borderRadius: '16px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Trạng thái kết nối:</span>
            {isConnected ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', background: 'var(--status-success-bg)', color: 'var(--status-success-text)', fontWeight: '500' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></span>
                Đang trực tuyến
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', background: 'var(--status-error-bg)', color: 'var(--status-error-text)', fontWeight: '500' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                Mất kết nối
              </span>
            )}
          </div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
            Chủ trọ Dashboard
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
