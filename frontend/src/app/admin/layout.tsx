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
  const { user, loading, logout } = useAuth();
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

  const { token: authToken } = useAuth();
  const token = authToken || 'demo-token';

  const { on, isConnected } = useSocket({
    token,
    autoConnect: !!token,
  });

  useEffect(() => {
    if (!token || !user) return;

    const landlordId = user.landlordId || user.id;

    const unsubscribe = on('new-rent-request', (newRequest: any) => {
      toast({
        title: '🔔 Yêu cầu tư vấn mới!',
        description: `Khách: ${newRequest.name} (${newRequest.phone}) đang quan tâm phòng của bạn.`,
        duration: 8000,
      });
    });

    const unsubscribePayment = on(`notification-landlord-${landlordId}`, (notification: any) => {
      toast({
        title: notification.title || '💰 Thông báo',
        description: notification.message,
        duration: 8000,
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribePayment) unsubscribePayment();
    };
  }, [on, token, user, toast]);

  if (loading || !user || user.role === 'TENANT') {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-light-base)' }}>Đang kiểm tra quyền truy cập...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-light-base)', color: 'var(--text-light-main)', fontFamily: 'Outfit, sans-serif' }}>
      {/* Sidebar Navigation */}
      <aside 
        className="neo-sidebar" 
        style={{ 
          width: 'var(--sidebar-width)', 
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          padding: '24px'
        }}
      >
        <div style={{ fontWeight: '800', fontSize: '1.5rem', marginBottom: '40px', color: 'var(--primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>S</span>
          SaaS Rent
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="/admin" style={{ padding: '12px 16px', borderRadius: '12px', fontWeight: '600', transition: 'all 0.2s', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
            Dashboard
          </a>
          <a href="/admin/rooms" style={{ padding: '12px 16px', borderRadius: '12px', fontWeight: '500', transition: 'all 0.2s', color: 'var(--text-light-muted)' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-light-surface-alt)'; e.currentTarget.style.color = 'var(--text-light-main)' }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-light-muted)' }}>
            Quản lý phòng
          </a>
          <a href="/admin/tenants" style={{ padding: '12px 16px', borderRadius: '12px', fontWeight: '500', transition: 'all 0.2s', color: 'var(--text-light-muted)' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-light-surface-alt)'; e.currentTarget.style.color = 'var(--text-light-main)' }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-light-muted)' }}>
            Khách thuê
          </a>
          <a href="/admin/contracts" style={{ padding: '12px 16px', borderRadius: '12px', fontWeight: '500', transition: 'all 0.2s', color: 'var(--text-light-muted)' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-light-surface-alt)'; e.currentTarget.style.color = 'var(--text-light-main)' }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-light-muted)' }}>
            Hợp đồng
          </a>
          <a href="/admin/invoices" style={{ padding: '12px 16px', borderRadius: '12px', fontWeight: '500', transition: 'all 0.2s', color: 'var(--text-light-muted)' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-light-surface-alt)'; e.currentTarget.style.color = 'var(--text-light-main)' }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-light-muted)' }}>
            Hóa đơn
          </a>
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
          <button 
            onClick={logout}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', fontWeight: '600', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header 
          className="neo-header"
          style={{ 
            height: 'var(--header-height)', 
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-light-muted)', fontWeight: '500' }}>Trạng thái:</span>
            {isConnected ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'var(--status-success-bg)', color: 'var(--status-success-text)', fontWeight: '600' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></span>
                Trực tuyến
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'var(--status-error-bg)', color: 'var(--status-error-text)', fontWeight: '600' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                Mất kết nối
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-light-main)' }}>{user.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)' }}>Quản trị viên</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
