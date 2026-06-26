'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../components/ui/use-toast';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#3b82f6,#60a5fa)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f43f5e,#fb7185)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#06b6d4,#22d3ee)',
  'linear-gradient(135deg,#d946ef,#e879f9)',
  'linear-gradient(135deg,#14b8a6,#2dd4bf)',
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTenantInfo, setSelectedTenantInfo] = useState<Tenant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });

  const { toast } = useToast();
  const { token } = useAuth();

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/tenants`, { cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTenants(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (token) fetchTenants(); }, [token]);

  const stats = useMemo(() => ({
    total: tenants.length,
    pending: tenants.filter(t => t.status === 'PENDING').length,
    approved: tenants.filter(t => t.status === 'APPROVED').length,
  }), [tenants]);

  const filtered = useMemo(() => tenants.filter(t => {
    const matchSearch = !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery);
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchSearch && matchStatus;
  }), [tenants, searchQuery, filterStatus]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/tenants`, {
        method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã thêm khách thuê mới', duration: 3000 });
        setShowAddModal(false);
        setFormData({ name: '', email: '', phone: '', password: '' });
        fetchTenants();
      } else {
        setInlineError(result.message || 'Thêm thất bại');
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể kết nối đến server', duration: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa khách thuê ${name} không?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/tenants/${id}`, { method: 'DELETE', cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã xóa khách thuê', duration: 3000 });
        setTenants(tenants.filter(t => t.id !== id));
      } else {
        const result = await res.json();
        toast({ title: 'Lỗi', description: result.message || 'Xóa thất bại', duration: 3000 });
      }
    } catch { toast({ title: 'Lỗi', description: 'Không thể kết nối đến server', duration: 3000 }); }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/tenants/${id}/status`, {
        method: 'PATCH', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast({ title: 'Thành công', description: `Đã ${newStatus === 'APPROVED' ? 'duyệt' : 'cập nhật'} khách thuê`, duration: 3000 });
        setTenants(tenants.map(t => t.id === id ? { ...t, status: newStatus } : t));
      } else {
        const result = await res.json();
        toast({ title: 'Lỗi', description: result.message || 'Cập nhật thất bại', duration: 3000 });
      }
    } catch { toast({ title: 'Lỗi', description: 'Không thể kết nối đến server', duration: 3000 }); }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN');

  const getStatusBadge = (status: string) => {
    if (status === 'PENDING') return <span className="badge badge-warning"><span className="badge-dot" />Chờ duyệt</span>;
    if (status === 'APPROVED') return <span className="badge badge-success"><span className="badge-dot" />Đã duyệt</span>;
    return <span className="badge badge-gray">{status}</span>;
  };

  const statCards = [
    { label: 'Tổng khách thuê', value: stats.total, color: 'indigo', icon: '👥' },
    { label: 'Chờ duyệt', value: stats.pending, color: 'yellow', icon: '⏳' },
    { label: 'Đã duyệt', value: stats.approved, color: 'green', icon: '✅' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Khách thuê</h1>
          <p className="page-subtitle">Quản lý danh sách khách thuê và tài khoản hệ thống</p>
        </div>
        <button
          onClick={() => { setInlineError(''); setShowAddModal(true); }}
          className="btn-primary"
          style={{ padding: '10px 20px', borderRadius: 12, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          + Thêm khách thuê
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {statCards.map((card, i) => (
          <div key={i} className={`stat-card ${card.color} animate-fade-in`} style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-card-label">{card.label}</span>
              <div className={`stat-card-icon ${card.color}`}>{card.icon}</div>
            </div>
            <div className="stat-card-value">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: '1 1 260px', minWidth: 220 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: 'var(--text-light-muted)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input placeholder="Tìm theo tên, email, số điện thoại..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ color: 'var(--text-light-muted)', fontSize: 18, lineHeight: 1 }}>×</button>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PENDING', label: '⏳ Chờ duyệt' },
            { key: 'APPROVED', label: '✅ Đã duyệt' },
          ].map(s => (
            <button key={s.key} onClick={() => setFilterStatus(s.key)} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
              border: '1px solid', borderColor: filterStatus === s.key ? 'var(--primary)' : 'var(--border-light)',
              background: filterStatus === s.key ? 'rgba(79,70,229,0.08)' : 'white',
              color: filterStatus === s.key ? 'var(--primary)' : 'var(--text-light-muted)',
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
            }}>{s.label}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-light-muted)', fontWeight: 500 }}>
          {filtered.length} / {tenants.length} khách
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border-light)', boxShadow: 'var(--neo-shadow)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(79,70,229,0.15)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: 'var(--text-light-muted)', fontSize: '0.9rem' }}>Đang tải danh sách...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">{tenants.length === 0 ? 'Chưa có khách thuê nào' : 'Không tìm thấy kết quả'}</div>
            {tenants.length === 0 && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ marginTop: 8, padding: '10px 20px', borderRadius: 12 }}>+ Thêm khách thuê đầu tiên</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Khách thuê</th>
                  <th>Thông tin liên hệ</th>
                  <th>Trạng thái</th>
                  <th>Ngày tham gia</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => (
                  <tr key={t.id} className="animate-slide-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: getGradient(t.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.88rem', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                          {getInitials(t.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-light-main)' }}>{t.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-light-muted)', marginTop: 1 }}>ID: {t.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-light-main)' }}>{t.phone}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)', marginTop: 2 }}>{t.email}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {getStatusBadge(t.status)}
                        {t.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'APPROVED')}
                            style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
                          >
                            ✓ Duyệt ngay
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light-muted)' }}>{formatDate(t.createdAt)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {t.status === 'APPROVED' && (
                          <Link
                            href={`/admin/contracts?tenantId=${t.id}`}
                            className="btn-icon btn-icon-blue"
                            style={{ textDecoration: 'none' }}
                          >
                            📄 Tạo HĐ
                          </Link>
                        )}
                        <button onClick={() => setSelectedTenantInfo(t)} className="btn-icon btn-icon-purple">🔑 TK</button>
                        <button onClick={() => handleDelete(t.id, t.name)} className="btn-icon btn-icon-red">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-panel-light" style={{ maxWidth: 460 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-light-main)' }}>Thêm khách thuê mới</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginTop: 2 }}>Tạo tài khoản đăng nhập cho khách thuê</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-light-muted)' }}>×</button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Họ và tên</label>
                <input required className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="form-label">Email (Tài khoản đăng nhập)</label>
                <input required type="email" className="form-input" value={formData.email} onChange={e => { setFormData({ ...formData, email: e.target.value }); setInlineError(''); }} placeholder="email@example.com" />
                {inlineError && <div className="animate-fade-in" style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 6, fontWeight: 500 }}>⚠️ {inlineError}</div>}
              </div>
              <div>
                <label className="form-label">Số điện thoại</label>
                <input required className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="0901234567" />
              </div>
              <div>
                <label className="form-label">Mật khẩu (tùy chọn)</label>
                <input type="password" minLength={6} className="form-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Mặc định: password123" />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)', marginTop: 4 }}>Khách thuê dùng email + mật khẩu này để đăng nhập</p>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-light" style={{ flex: 1, padding: 11, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Hủy</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, padding: 11, borderRadius: 10 }}>
                  {isSubmitting ? '⏳ Đang thêm...' : '✅ Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Info Modal */}
      {selectedTenantInfo && (
        <div className="modal-overlay">
          <div className="modal-panel-light" style={{ maxWidth: 420 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-light-main)' }}>Thông tin tài khoản</h2>
              <button onClick={() => setSelectedTenantInfo(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-light-muted)' }}>×</button>
            </div>
            <div style={{ padding: 28 }}>
              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '16px 18px', background: 'var(--bg-light-surface-alt)', borderRadius: 14, border: '1px solid var(--border-light)' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: getGradient(selectedTenantInfo.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                  {getInitials(selectedTenantInfo.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-light-main)' }}>{selectedTenantInfo.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginTop: 2 }}>📞 {selectedTenantInfo.phone}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Email đăng nhập</div>
                  <div style={{ background: 'var(--bg-light-surface-alt)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-light)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-light-main)', userSelect: 'all' }}>
                    {selectedTenantInfo.email}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Mật khẩu</div>
                  <div style={{ background: 'rgba(245,158,11,0.06)', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: '1rem' }}>🔒</span>
                      <span style={{ fontWeight: 700, color: '#d97706', fontSize: '0.9rem' }}>Đã mã hóa bảo mật</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)', lineHeight: 1.5 }}>
                      Mật khẩu mặc định khi tạo là <strong>password123</strong>. Vì lý do bảo mật, hệ thống không lưu dạng văn bản.
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedTenantInfo(null)} className="btn-primary" style={{ width: '100%', padding: '11px', borderRadius: 12, marginTop: 4 }}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
