'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/use-toast';

interface RentRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  status: 'PENDING' | 'CONTACTED' | 'CANCELLED';
  createdAt: string;
  room?: { roomNumber: string };
  hasExistingAccount?: boolean;
  existingUserStatus?: string;
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#3b82f6,#60a5fa)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f43f5e,#fb7185)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#06b6d4,#22d3ee)',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
}

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<RentRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Edit & Delete states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RentRequest | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });

  // Create Tenant states
  const [showCreateTenantModal, setShowCreateTenantModal] = useState(false);
  const [createTenantData, setCreateTenantData] = useState({ name: '', phone: '', email: '', password: 'password123' });
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [inlineError, setInlineError] = useState<string>('');
  const { toast } = useToast();

  const { token: authToken } = useAuth();
  const token = authToken || 'demo-token';

  const { on } = useSocket({ token, autoConnect: !!token });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://thesis-2rkn.onrender.com/rent-requests', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Lấy danh sách yêu cầu thất bại');
        const list = Array.isArray(result) ? result : result.data || [];
        setRequests(list);
      } catch (error: any) {
        setErrorMessage(error.message || 'Lỗi kết nối server');
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchRequests();
    else setIsLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const unsubscribe = on('new-rent-request', (newRequest: any) => {
      setRequests((prev) => [newRequest, ...prev]);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [on, token]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    contacted: requests.filter(r => r.status === 'CONTACTED').length,
    cancelled: requests.filter(r => r.status === 'CANCELLED').length,
  }), [requests]);

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchSearch = !searchQuery || 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, filterStatus]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('vi-VN');

  const handleUpdateStatus = async (id: string, status: 'PENDING' | 'CONTACTED' | 'CANCELLED') => {
    try {
      const res = await fetch(`https://thesis-2rkn.onrender.com/rent-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa đăng ký này?')) return;
    try {
      const res = await fetch(`https://thesis-2rkn.onrender.com/rent-requests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setRequests(requests.filter(r => r.id !== id));
    } catch (error) { console.error(error); }
  };

  const openEditModal = (req: RentRequest) => {
    setSelectedReq(req);
    setFormData({ name: req.name, phone: req.phone, email: req.email, message: req.message || '' });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      const res = await fetch(`https://thesis-2rkn.onrender.com/rent-requests/${selectedReq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setRequests(requests.map(r => r.id === selectedReq.id ? { ...r, ...formData } : r));
        setShowEditModal(false);
        toast({ title: 'Thành công', description: 'Đã cập nhật thông tin', duration: 3000 });
      }
    } catch (error) { console.error(error); }
  };

  const openCreateTenantModal = (req: RentRequest) => {
    setInlineError('');
    setCreateTenantData({ name: req.name, phone: req.phone, email: req.email, password: 'password123' });
    setShowCreateTenantModal(true);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTenant(true);
    try {
      const res = await fetch('https://thesis-2rkn.onrender.com/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(createTenantData)
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã tạo tài khoản Khách thuê', duration: 3000 });
        setShowCreateTenantModal(false);
      } else {
        setInlineError(result.message || 'Lỗi tạo khách thuê');
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Lỗi kết nối', duration: 3000 });
    } finally {
      setCreatingTenant(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PENDING') return <span className="badge badge-warning"><span className="badge-dot" />Chờ liên hệ</span>;
    if (status === 'CONTACTED') return <span className="badge badge-success"><span className="badge-dot" />Đã liên hệ</span>;
    return <span className="badge badge-danger"><span className="badge-dot" />Đã hủy</span>;
  };

  const statCards = [
    { label: 'Tổng yêu cầu', value: stats.total, color: 'indigo', icon: '📋' },
    { label: 'Chờ liên hệ', value: stats.pending, color: 'yellow', icon: '⏳' },
    { label: 'Đã liên hệ', value: stats.contacted, color: 'green', icon: '✅' },
    { label: 'Đã hủy', value: stats.cancelled, color: 'red', icon: '❌' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Yêu cầu tư vấn</h1>
          <p className="page-subtitle">Quản lý các yêu cầu thuê phòng từ khách hàng · Cập nhật thời gian thực</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', fontWeight: 500 }}>Live</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map((card, i) => (
          <div key={i} className={`stat-card ${card.color} animate-fade-in`} style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-card-label">{card.label}</span>
              <div className={`stat-card-icon ${card.color}`}>{card.icon}</div>
            </div>
            <div className="stat-card-value animate-count">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: '1 1 260px', minWidth: 220 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: 'var(--text-light-muted)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Tìm theo tên, SĐT, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ color: 'var(--text-light-muted)', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'PENDING', 'CONTACTED', 'CANCELLED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '8px 14px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
                border: '1px solid',
                borderColor: filterStatus === s ? 'var(--primary)' : 'var(--border-light)',
                background: filterStatus === s ? 'rgba(79,70,229,0.08)' : 'white',
                color: filterStatus === s ? 'var(--primary)' : 'var(--text-light-muted)',
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
              }}
            >
              {s === 'ALL' ? 'Tất cả' : s === 'PENDING' ? 'Chờ' : s === 'CONTACTED' ? 'Đã liên hệ' : 'Đã hủy'}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-light-muted)', fontWeight: 500 }}>
          {filtered.length} / {requests.length} yêu cầu
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border-light)', boxShadow: 'var(--neo-shadow)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(79,70,229,0.15)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: 'var(--text-light-muted)', fontSize: '0.9rem' }}>Đang tải danh sách...</span>
          </div>
        ) : errorMessage ? (
          <div style={{ padding: '20px', margin: '20px', background: 'var(--status-error-bg)', color: 'var(--status-error-text)', borderRadius: 10, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ {errorMessage}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">
              {requests.length === 0 ? 'Chưa có yêu cầu tư vấn nào' : 'Không tìm thấy kết quả phù hợp'}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light-muted)' }}>
              {requests.length > 0 ? 'Thử thay đổi từ khóa hoặc bộ lọc' : 'Yêu cầu từ Landing Page sẽ xuất hiện tại đây'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Liên hệ</th>
                  <th>Lời nhắn</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req, idx) => (
                  <tr
                    key={req.id}
                    className="animate-slide-in"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: getAvatarColor(req.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>
                          {getInitials(req.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-light-main)' }}>{req.name}</div>
                          {req.room && (
                            <span className="badge badge-blue" style={{ marginTop: 3, fontSize: '0.68rem' }}>🏠 Phòng {req.room.roomNumber}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-light-main)' }}>{req.phone}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)', marginTop: 2 }}>{req.email}</div>
                      {req.hasExistingAccount && (
                        <span className="badge badge-purple" style={{ marginTop: 4, fontSize: '0.68rem' }}>
                          Đã có TK · {req.existingUserStatus === 'PENDING' ? 'Chờ duyệt' : 'Đã duyệt'}
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} title={req.message}>
                        {req.message || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Không có lời nhắn</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-light-muted)' }}>{formatDate(req.createdAt)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        {getStatusBadge(req.status)}
                        <select
                          value={req.status}
                          onChange={(e) => handleUpdateStatus(req.id, e.target.value as any)}
                          style={{
                            fontSize: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--bg-light-surface-alt)',
                            color: 'var(--text-light-muted)', borderRadius: 6, padding: '3px 6px', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                          }}
                        >
                          <option value="PENDING">Chờ liên hệ</option>
                          <option value="CONTACTED">Đã liên hệ</option>
                          <option value="CANCELLED">Hủy</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {req.hasExistingAccount ? (
                          <button
                            onClick={() => window.location.href = '/admin/tenants'}
                            className="btn-icon btn-icon-purple"
                          >
                            👤 Quản lý
                          </button>
                        ) : (
                          <button onClick={() => openCreateTenantModal(req)} className="btn-icon btn-icon-green">
                            ➕ Tạo KH
                          </button>
                        )}
                        <button onClick={() => openEditModal(req)} className="btn-icon btn-icon-blue">✏️ Sửa</button>
                        <button onClick={() => handleDelete(req.id)} className="btn-icon btn-icon-red">🗑️ Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedReq && (
        <div className="modal-overlay">
          <div className="modal-panel-light" style={{ maxWidth: 480 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-light-main)' }}>Sửa thông tin khách hàng</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginTop: 2 }}>Cập nhật thông tin yêu cầu tư vấn</p>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: 'var(--text-light-muted)' }}>×</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Tên khách hàng', key: 'name', type: 'text', required: true },
                { label: 'Số điện thoại', key: 'phone', type: 'text', required: true },
                { label: 'Email', key: 'email', type: 'email', required: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input
                    required={f.required} type={f.type} className="form-input"
                    value={(formData as any)[f.key]}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="form-label">Lời nhắn</label>
                <textarea className="form-input" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} style={{ minHeight: 80, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-light" style={{ flex: 1, padding: 11, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: 11, borderRadius: 10 }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateTenantModal && (
        <div className="modal-overlay">
          <div className="modal-panel-light" style={{ maxWidth: 480 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-light-main)' }}>Tạo tài khoản khách thuê</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginTop: 2 }}>Tạo tài khoản để khách đăng nhập vào hệ thống</p>
              </div>
              <button onClick={() => setShowCreateTenantModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: 'var(--text-light-muted)' }}>×</button>
            </div>
            <form onSubmit={handleCreateTenant} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Tên khách hàng', key: 'name', type: 'text' },
                { label: 'Số điện thoại', key: 'phone', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input required type={f.type} className="form-input" value={(createTenantData as any)[f.key]} onChange={e => setCreateTenantData({ ...createTenantData, [f.key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="form-label">Email (Tài khoản đăng nhập)</label>
                <input required type="email" className="form-input" value={createTenantData.email} onChange={e => { setCreateTenantData({ ...createTenantData, email: e.target.value }); setInlineError(''); }} />
                {inlineError && <div className="animate-fade-in" style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>⚠️ {inlineError}</div>}
              </div>
              <div>
                <label className="form-label">Mật khẩu</label>
                <input required type="text" minLength={6} className="form-input" value={createTenantData.password} onChange={e => setCreateTenantData({ ...createTenantData, password: e.target.value })} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)', marginTop: 4 }}>Khách dùng mật khẩu này để đăng nhập lần đầu</p>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowCreateTenantModal(false)} className="btn-light" style={{ flex: 1, padding: 11, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Hủy</button>
                <button type="submit" disabled={creatingTenant} className="btn-primary" style={{ flex: 1, padding: 11, borderRadius: 10 }}>
                  {creatingTenant ? '⏳ Đang tạo...' : '✅ Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
