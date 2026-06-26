'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../components/ui/use-toast'; 
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    href: '/admin',
    label: 'Tổng quan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    exact: true,
  },
  {
    href: '/admin/rooms',
    label: 'Quản lý phòng',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/admin/tenants',
    label: 'Khách thuê',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/admin/contracts',
    label: 'Hợp đồng',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: '/admin/invoices',
    label: 'Hóa đơn',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

const AVATAR_COLORS = ['avatar-indigo', 'avatar-blue', 'avatar-emerald', 'avatar-rose', 'avatar-amber', 'avatar-fuchsia'];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { toast } = useToast();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const update = () => {
      setCurrentTime(new Date().toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

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
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light-base)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(79,70,229,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ color: 'var(--text-light-muted)', fontSize: '0.9rem' }}>Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    );
  }

  const avatarColor = AVATAR_COLORS[(user.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const initials = user.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()
    : 'A';

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-light-base)', color: 'var(--text-light-main)', fontFamily: 'Outfit, sans-serif' }}>
      <style>{`
        @media (max-width: 768px) {
          .admin-layout { flex-direction: column !important; }
          .neo-sidebar { 
            position: fixed !important; 
            bottom: 0 !important; 
            top: auto !important;
            width: 100% !important; 
            height: 65px !important; 
            flex-direction: row !important;
            border-top: 1px solid var(--border-light);
            border-right: none !important;
            z-index: 50 !important;
            background: var(--bg-light-base) !important;
            padding: 0 !important;
          }
          .neo-sidebar > div:first-child, .neo-sidebar > div:last-child { display: none !important; }
          .neo-sidebar nav { 
            flex-direction: row !important; 
            justify-content: space-around !important; 
            padding: 0 !important; 
            overflow: visible !important;
          }
          .sidebar-nav-item { 
            flex-direction: column !important; 
            justify-content: center !important;
            align-items: center !important;
            font-size: 0.65rem !important; 
            padding: 8px 4px !important; 
            gap: 4px !important;
            border-radius: 0 !important;
            background: transparent !important;
            margin: 0 !important;
          }
          .sidebar-nav-item:hover { background: transparent !important; }
          .sidebar-nav-item .nav-icon { margin-right: 0 !important; }
          .sidebar-nav-item span:last-child:not(.nav-icon) { display: none !important; }
          .neo-sidebar nav > div:first-child { display: none !important; }
          
          .admin-layout > div { margin-bottom: 65px !important; }
          .neo-header { padding: 0 16px !important; }
          main { padding: 16px 16px 40px !important; }
          .mobile-logout-btn { display: flex !important; }
        }
      `}</style>
      {/* ====== SIDEBAR ====== */}
      <aside
        className="neo-sidebar"
        style={{
          width: 'var(--sidebar-width)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          padding: '0',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '1.1rem',
              boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
              flexShrink: 0,
            }}>S</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-light-main)', letterSpacing: '-0.02em' }}>SaaS Rent</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-light-muted)', fontWeight: 500 }}>Quản lý trọ thông minh</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-light-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 6 }}>
            Menu chính
          </div>
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
              >
                <span className="nav-icon" style={{ color: active ? 'var(--primary)' : 'var(--text-light-muted)' }}>
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Section */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-light)' }}>
          {/* Admin info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-light-surface-alt)', borderRadius: 12, marginBottom: 8, border: '1px solid var(--border-light)' }}>
            <div className={`avatar avatar-sm ${avatarColor}`}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-light-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-light-muted)' }}>Quản trị viên</div>
            </div>
            <div className="badge badge-purple" style={{ padding: '2px 6px', fontSize: '0.62rem' }}>ADMIN</div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem',
              background: 'rgba(239, 68, 68, 0.06)', color: '#dc2626',
              border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header
          className="neo-header"
          style={{
            height: 'var(--header-height)',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Left: breadcrumb + time */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {navItems.find(n => isActive(n)) && (
                <>
                  <span style={{ color: 'var(--text-light-muted)', fontSize: '0.8rem' }}>Admin</span>
                  <span style={{ color: 'var(--border-light)', fontSize: '0.8rem' }}>/</span>
                  <span style={{ color: 'var(--text-light-main)', fontSize: '0.8rem', fontWeight: 600 }}>
                    {navItems.find(n => isActive(n))?.label}
                  </span>
                </>
              )}
            </div>
            {currentTime && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-light-muted)' }}>{currentTime}</span>
            )}
          </div>

          {/* Right: Status + User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Connection status */}
            {isConnected ? (
              <span className="badge badge-success">
                <span className="badge-dot" style={{ boxShadow: '0 0 6px #22c55e' }} />
                Trực tuyến
              </span>
            ) : (
              <span className="badge badge-danger">
                <span className="badge-dot" />
                Mất kết nối
              </span>
            )}

            {/* User avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 6px', background: 'var(--bg-light-surface-alt)', borderRadius: 999, border: '1px solid var(--border-light)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className={`avatar avatar-sm ${avatarColor}`}>{initials}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-light-main)' }}>{user.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-light-muted)' }}>Chủ trọ</div>
              </div>
            </div>

            {/* Logout button (Mobile only) */}
            <button
              onClick={logout}
              className="mobile-logout-btn"
              style={{
                display: 'none',
                padding: '8px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)',
                alignItems: 'center', justifyContent: 'center'
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '28px 28px 40px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
