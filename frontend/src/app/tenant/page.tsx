'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../components/ui/use-toast';
import Chatbot from '../../components/Chatbot';

export default function TenantDashboard() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'incidents'>('invoices');

  const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID || 'MB';
  const ACCOUNT_NO = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0901234567';
  const ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'NGUYEN VAN A';

  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState('ELECTRICITY');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentError, setIncidentError] = useState('');
  const [incidentTitle, setIncidentTitle] = useState('');

  const { on } = useSocket({ token: token || undefined, autoConnect: !!token });

  useEffect(() => {
    if (!token || !user) return;
    const unsubscribe = on(`notification-${user.id}`, (notification: any) => {
      if (notification.title === 'Cập nhật sự cố') {
        const fetchIncidentsOnly = async () => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/incidents`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            setIncidents(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
          }
        };
        fetchIncidentsOnly();
      }
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [on, token, user]);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user && user.role !== 'TENANT') { router.push('/login'); return; }
    if (user?.status === 'PENDING') { setLoading(false); return; }

    const fetchData = async () => {
      if (!token) return;
      try {
        const [invRes, conRes, incRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/invoices`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/contracts`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/incidents`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (invRes.ok) { const data = await invRes.json(); setInvoices(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []); }
        if (conRes.ok) { const data = await conRes.json(); setContracts(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []); }
        if (incRes.ok) { const data = await incRes.json(); setIncidents(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []); }
      } catch { toast({ title: 'Lỗi', description: 'Không thể tải dữ liệu' }); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user, token, router, authLoading]);

  useEffect(() => {
    if (invoices.length === 0) return;
    const unpaid = invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE');
    if (unpaid.length > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let hasOverdue = false, hasDueSoon = false;
      unpaid.forEach(inv => {
        const due = new Date(inv.dueDate); due.setHours(0, 0, 0, 0);
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) hasOverdue = true;
        if (diff === 0 || diff === 1) hasDueSoon = true;
      });
      if (hasOverdue) toast({ title: '🚨 Hóa đơn quá hạn!', description: 'Bạn đang có hóa đơn quá hạn thanh toán!', duration: 10000 });
      else if (hasDueSoon) toast({ title: '⏰ Nhắc nhở thanh toán', description: 'Sắp đến hạn thanh toán tiền phòng.', duration: 8000 });
    }
  }, [invoices, toast]);

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/invoices/${invoiceId}/pay`, { method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã gửi thông báo thanh toán cho chủ trọ.' });
        setInvoices(invoices.map(i => i.id === invoiceId ? { ...i, status: 'PAID' } : i));
        setPayingInvoice(null);
      } else { toast({ title: 'Lỗi', description: 'Không thể xử lý thanh toán' }); }
    } catch { toast({ title: 'Lỗi', description: 'Không thể kết nối' }); }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncidentError('');
    const roomId = currentContract?.roomId || currentContract?.room?.id;
    if (!roomId) { setIncidentError('Không tìm thấy thông tin phòng để báo cáo.'); return; }
    const title = incidentTitle || incidentType;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/incidents`, {
        method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description: incidentDescription, roomId })
      });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã gửi báo cáo sự cố cho chủ trọ.' });
        setShowIncidentModal(false);
        setIncidentDescription(''); setIncidentTitle('');
        const incRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/incidents`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
        if (incRes.ok) { const data = await incRes.json(); setIncidents(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []); }
        setActiveTab('incidents');
      } else {
        const errorData = await res.json().catch(() => null);
        setIncidentError(errorData?.message || 'Không thể gửi báo cáo.');
      }
    } catch (err: any) { setIncidentError(err.message || 'Không thể kết nối đến máy chủ.'); }
  };

  if (loading || authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light-base)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(79,70,229,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ color: 'var(--text-light-muted)', fontSize: '0.9rem' }}>Đang tải...</span>
        </div>
      </div>
    );
  }

  if (user?.status === 'PENDING') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="neo-card animate-fade-in" style={{ maxWidth: 440, width: '100%', padding: 40, textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>⏳</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-light-main)' }}>Đang chờ phê duyệt</h2>
          <p style={{ color: 'var(--text-light-muted)', lineHeight: 1.7, marginBottom: 28 }}>
            Tài khoản của bạn đã được đăng ký thành công. Hệ thống đang chờ chủ trọ xác nhận hợp đồng. Vui lòng quay lại sau.
          </p>
          <button onClick={logout} className="btn-primary" style={{ width: '100%', padding: 14, borderRadius: 12, fontSize: '1rem' }}>Đăng xuất</button>
        </div>
      </div>
    );
  }

  const currentContract = contracts.length > 0 ? contracts[0] : null;
  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const unpaidInvoices = invoices.filter(i => i.status !== 'PAID');
  const paidInvoices = invoices.filter(i => i.status === 'PAID');
  const totalDebt = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);
  
  const initials = user?.name ? user.name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() : 'KT';

  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');
  const formatCurrency = (n: number) => Number(n).toLocaleString('vi-VN') + ' đ';
  const getDaysLeft = (endDate: string) => Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const getDaysUntilDue = (dueDate: string) => Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="tenant-layout" style={{ minHeight: '100vh', fontFamily: 'Outfit, sans-serif', color: 'var(--text-light-main)', background: 'var(--bg-light-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .tenant-hero-grid { grid-template-columns: 1fr !important; }
          .tenant-stats-grid { grid-template-columns: 1fr !important; }
          .neo-header > div { padding: 0 16px !important; }
          main { padding: 20px 16px 80px !important; }
          .payment-modal { padding: 24px !important; }
          .payment-qr { width: 150px !important; height: 150px !important; }
          .welcome-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .welcome-header button { width: 100% !important; justify-content: center !important; }
        }
      `}</style>
      {/* Navbar */}
      <header className="neo-header" style={{ position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-light-main)' }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,var(--primary),var(--accent))', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light-main)', fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(79,70,229,0.4)' }}>S</div>
            SaaS Rent
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {activeIncidents.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(239,68,68,0.15)', borderRadius: 999, border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.8rem', fontWeight: 700 }}>
                ⚠️ {activeIncidents.length} sự cố
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 6px', background: 'var(--bg-light-surface-alt)', borderRadius: 999, border: '1px solid var(--border-light)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light-main)', fontWeight: 800, fontSize: '0.8rem', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>{initials}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-light-muted)' }}>Khách thuê</div>
              </div>
            </div>
            <button
              onClick={logout}
              style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 80px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Welcome */}
        <div className="welcome-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Xin chào, <span className="text-gradient">{user?.name?.split(' ').pop()}</span>! 👋
            </h1>
            <p style={{ color: 'var(--text-light-muted)', marginTop: 4 }}>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setShowIncidentModal(true)}
            style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#f87171', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          >
            ⚠️ Báo cáo sự cố
          </button>
        </div>

        {currentContract ? (
          <div className="tenant-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Left: Contract Hero Card */}
            <div style={{ gridColumn: '1 / 2' }}>
              <div className="neo-card animate-fade-in" style={{ padding: 28, height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Hợp đồng hiện tại</div>
                    <span style={{ padding: '4px 12px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, border: '1px solid rgba(34,197,94,0.3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                      Đang có hiệu lực
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', textAlign: 'right' }}>
                    Mã HĐ: <span style={{ fontWeight: 700, color: '#818cf8' }}>{currentContract.contractNumber}</span>
                  </div>
                </div>

                {/* Room Number Big Display */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                  <div style={{ flex: 1, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)', marginBottom: 4 }}>Số phòng</div>
                    <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#818cf8', lineHeight: 1 }}>{currentContract.room?.roomNumber || 'N/A'}</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)', marginBottom: 4 }}>Tiền thuê/tháng</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#c084fc' }}>{formatCurrency(currentContract.rentalPrice)}</div>
                  </div>
                </div>

                {/* Contract info rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px', background: 'var(--bg-light-surface-alt)', borderRadius: 14, border: '1px solid var(--border-light)' }}>
                  {[
                    { icon: '📅', label: 'Thời gian thuê', value: `${formatDate(currentContract.startDate)} → ${formatDate(currentContract.endDate)}` },
                    { icon: '💰', label: 'Tiền cọc', value: formatCurrency(currentContract.deposit || 0) },
                    { icon: '⏰', label: 'Còn lại', value: `${getDaysLeft(currentContract.endDate)} ngày` },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-light-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>{row.icon} {row.label}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                  {/* Days progress bar */}
                  {(() => {
                    const total = getDaysLeft(currentContract.endDate) + Math.ceil((Date.now() - new Date(currentContract.startDate).getTime()) / (1000 * 60 * 60 * 24));
                    const elapsed = total - Math.max(getDaysLeft(currentContract.endDate), 0);
                    const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                    return (
                      <div style={{ paddingTop: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-light-muted)' }}>Tiến độ hợp đồng</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8' }}>{pct}%</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 999, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Right: Financial Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Debt summary */}
              {totalDebt > 0 ? (
                <div className="neo-card animate-fade-in" style={{ animationDelay: '0.1s', padding: 24, borderTop: '3px solid #ef4444', flex: 'none' }}>
                  <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🚨 Số dư cần thanh toán</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f87171', letterSpacing: '-0.03em', marginBottom: 12 }}>{formatCurrency(totalDebt)}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-light-main)' }}>{unpaidInvoices.length}</span> hóa đơn chưa đóng
                    </div>
                    {unpaidInvoices.some(i => i.status === 'OVERDUE') && (
                      <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 700 }}>
                        ⚠️ {unpaidInvoices.filter(i => i.status === 'OVERDUE').length} quá hạn
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="neo-card animate-fade-in" style={{ animationDelay: '0.1s', padding: 24, borderTop: '3px solid #22c55e', flex: 'none', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#4ade80' }}>Không có dư nợ!</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginTop: 4 }}>Bạn đã thanh toán đầy đủ</div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="tenant-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Tổng hóa đơn', value: invoices.length, color: '#818cf8', icon: '📋' },
                  { label: 'Đã thanh toán', value: paidInvoices.length, color: '#4ade80', icon: '✅' },
                  { label: 'Sự cố đang mở', value: activeIncidents.length, color: '#f87171', icon: '⚠️' },
                  { label: 'Đã giải quyết', value: incidents.filter(i => i.status === 'RESOLVED').length, color: '#60a5fa', icon: '🔧' },
                ].map((s, i) => (
                  <div key={i} className="neo-card animate-fade-in" style={{ animationDelay: `${0.15 + i * 0.05}s`, padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-light-muted)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs: Invoices & Incidents */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="neo-card animate-fade-in" style={{ animationDelay: '0.25s', overflow: 'hidden' }}>
                {/* Tab Header */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', padding: '0 8px' }}>
                  {[
                    { key: 'invoices', label: '💰 Hóa đơn', badge: unpaidInvoices.length },
                    { key: 'incidents', label: '⚠️ Sự cố', badge: activeIncidents.length },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      style={{
                        padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        fontSize: '0.9rem', fontWeight: activeTab === tab.key ? 700 : 500,
                        color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-light-muted)',
                        borderBottom: `2px solid ${activeTab === tab.key ? '#818cf8' : 'transparent'}`,
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      {tab.label}
                      {tab.badge > 0 && (
                        <span style={{ background: '#ef4444', color: 'var(--text-light-main)', borderRadius: 999, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>{tab.badge}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div style={{ padding: 24 }}>
                  {activeTab === 'invoices' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {invoices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light-muted)' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.5 }}>💰</div>
                          <div style={{ fontWeight: 600 }}>Chưa có hóa đơn nào</div>
                        </div>
                      ) : invoices.map((inv, idx) => {
                        const daysUntil = getDaysUntilDue(inv.dueDate);
                        const isOverdue = inv.status === 'OVERDUE';
                        return (
                          <div key={inv.id} className="animate-slide-in" style={{ animationDelay: `${idx * 0.04}s`, padding: '18px 20px', background: 'var(--bg-light-surface-alt)', borderRadius: 14, border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--border-light)'}`, borderLeft: `4px solid ${inv.status === 'PAID' ? '#22c55e' : isOverdue ? '#ef4444' : '#f59e0b'}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{inv.invoiceNumber}</span>
                                {inv.status === 'PAID' ? <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderRadius: 999, fontWeight: 700 }}>✓ Đã thanh toán</span>
                                  : isOverdue ? <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: 999, fontWeight: 700 }}>🚨 Quá hạn</span>
                                  : <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', borderRadius: 999, fontWeight: 700 }}>⏳ Chờ thanh toán</span>}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)', display: 'flex', gap: 12 }}>
                                <span>Hạn: {formatDate(inv.dueDate)}</span>
                                {inv.status !== 'PAID' && (
                                  <span style={{ fontWeight: 700, color: daysUntil < 0 ? '#f87171' : daysUntil <= 3 ? '#fbbf24' : 'var(--text-light-muted)' }}>
                                    {daysUntil < 0 ? `Trễ ${Math.abs(daysUntil)} ngày` : daysUntil === 0 ? 'Hết hạn hôm nay!' : `Còn ${daysUntil} ngày`}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: inv.status === 'PAID' ? 'var(--text-light-main)' : '#f87171', marginBottom: 6 }}>
                                {formatCurrency(inv.amount)}
                              </div>
                              {inv.status !== 'PAID' && (
                                <button
                                  onClick={() => setPayingInvoice(inv)}
                                  className="btn-primary"
                                  style={{ padding: '7px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700 }}
                                >
                                  Thanh toán
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === 'incidents' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                        <button
                          onClick={() => setShowIncidentModal(true)}
                          className="btn-primary"
                          style={{ padding: '8px 16px', borderRadius: 10, fontSize: '0.85rem' }}
                        >+ Tạo báo cáo mới</button>
                      </div>
                      {incidents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light-muted)' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.5 }}>✅</div>
                          <div style={{ fontWeight: 600 }}>Không có sự cố nào</div>
                          <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Mọi thứ đang hoạt động tốt!</div>
                        </div>
                      ) : incidents.map((inc, idx) => (
                        <div key={inc.id} className="animate-slide-in" style={{ animationDelay: `${idx * 0.04}s`, padding: '16px 18px', background: 'var(--bg-light-surface-alt)', borderRadius: 14, border: `1px solid ${inc.status === 'RESOLVED' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.25)'}`, borderLeft: `4px solid ${inc.status === 'RESOLVED' ? '#22c55e' : '#f59e0b'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{inc.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)', marginTop: 2 }}>{formatDate(inc.createdAt)}</div>
                            </div>
                            {inc.status === 'RESOLVED'
                              ? <span style={{ fontSize: '0.72rem', padding: '3px 10px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderRadius: 999, fontWeight: 700, border: '1px solid rgba(34,197,94,0.25)' }}>✓ Đã xử lý</span>
                              : <span style={{ fontSize: '0.72rem', padding: '3px 10px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', borderRadius: 999, fontWeight: 700, border: '1px solid rgba(245,158,11,0.25)' }}>⏳ Đang xử lý</span>
                            }
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-light-muted)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{inc.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="neo-card animate-fade-in" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16, opacity: 0.6 }}>🏠</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 10 }}>Chưa có hợp đồng</h2>
            <p style={{ color: 'var(--text-light-muted)', lineHeight: 1.7 }}>
              Bạn chưa có hợp đồng phòng nào đang hoạt động.<br />Vui lòng liên hệ chủ trọ để được cấp hợp đồng.
            </p>
          </div>
        )}
      </main>

      <Chatbot tenantContext={{
        tenantName: user?.name,
        contract: currentContract ? {
          roomNumber: currentContract.room?.roomNumber,
          startDate: currentContract.startDate,
          endDate: currentContract.endDate,
          rentalPrice: currentContract.rentalPrice,
          electricityPrice: currentContract.electricityPrice,
          waterPrice: currentContract.waterPrice,
          memberCount: currentContract.memberCount,
        } : null,
        invoices: invoices.map(i => ({ amount: i.amount, status: i.status, dueDate: i.dueDate })),
        incidents: incidents.map(i => ({ title: i.title, description: i.description, status: i.status })),
      }} />

      {/* Payment Modal */}
      {payingInvoice && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="neo-card animate-fade-in payment-modal" style={{ maxWidth: 440, width: '100%', padding: 32, position: 'relative' }}>
            <button onClick={() => setPayingInvoice(null)} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', background: 'var(--border-light)', border: 'none', color: 'var(--text-light-muted)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 20, textAlign: 'center' }}>💳 Thanh toán hóa đơn</h2>
            <div style={{ background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginBottom: 6 }}>Số tiền cần thanh toán</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f87171', letterSpacing: '-0.03em' }}>{formatCurrency(payingInvoice.amount)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Ngân hàng', value: BANK_ID },
                { label: 'Số tài khoản', value: ACCOUNT_NO },
                { label: 'Chủ tài khoản', value: ACCOUNT_NAME },
                { label: 'Nội dung CK', value: `${(user as any)?.phone} ${payingInvoice.invoiceNumber}` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light-muted)' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: row.label === 'Nội dung CK' ? '#ef4444' : 'var(--text-light-main)' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img
                src="/qr-thanh-toan.jpg"
                alt="QR Code Thanh Toán"
                className="payment-qr"
                style={{ width: 180, height: 180, borderRadius: 12, border: '2px solid var(--border-light)', padding: 6, background: 'white', objectFit: 'contain' }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginTop: 8 }}>Quét mã QR để thanh toán nhanh</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPayingInvoice(null)} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', color: 'var(--text-light-muted)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Đóng</button>
              <button onClick={() => handlePayInvoice(payingInvoice.id)} className="btn-primary" style={{ flex: 1, padding: '11px', borderRadius: 12 }}>✅ Đã chuyển khoản</button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Modal */}
      {showIncidentModal && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="neo-card animate-fade-in" style={{ maxWidth: 460, width: '100%', padding: 32, position: 'relative' }}>
            <button onClick={() => setShowIncidentModal(false)} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', background: 'var(--border-light)', border: 'none', color: 'var(--text-light-muted)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>⚠️ Báo cáo sự cố</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-light-muted)', marginBottom: 24 }}>Mô tả sự cố để chủ trọ hỗ trợ xử lý sớm nhất</p>
            <form onSubmit={handleReportIncident} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Loại sự cố</label>
                <select className="form-input" style={{ background: "var(--bg-light-surface)", borderColor: "var(--border-light)", color: "var(--text-light-main)" }} value={incidentType} onChange={e => setIncidentType(e.target.value)}>
                  <option value="ELECTRICITY">⚡ Điện (Mất điện, chập cháy...)</option>
                  <option value="WATER">💧 Nước (Mất nước, rò rỉ...)</option>
                  <option value="FURNITURE">🪑 Nội thất (Hỏng giường, tủ...)</option>
                  <option value="OTHER">📋 Khác</option>
                </select>
              </div>
              <div>
                <label className="form-label">Tiêu đề sự cố</label>
                <input className="form-input" style={{ background: "var(--bg-light-surface)", borderColor: "var(--border-light)", color: "var(--text-light-main)" }} placeholder="VD: Mất nước tầng 2..." value={incidentTitle} onChange={e => setIncidentTitle(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Mô tả chi tiết <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  className="form-input" 
                  placeholder="Mô tả chi tiết sự cố bạn đang gặp phải..."
                  required
                  value={incidentDescription}
                  onChange={e => setIncidentDescription(e.target.value)}
                  style={{ background: "var(--bg-light-surface)", borderColor: "var(--border-light)", color: "var(--text-light-main)", minHeight: 100, resize: 'vertical' }}
                />
              </div>
              {incidentError && <div style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 500 }}>⚠️ {incidentError}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowIncidentModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', color: 'var(--text-light-muted)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Hủy</button>
                <button type="submit" style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: 'var(--text-light-main)', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem' }}>
                  📤 Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
