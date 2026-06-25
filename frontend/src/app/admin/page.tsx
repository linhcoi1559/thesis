'use client';

import React, { useState, useEffect } from 'react';
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
  room?: {
    roomNumber: string;
  };
  hasExistingAccount?: boolean;
  existingUserStatus?: string;
}

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<RentRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
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

  const { on } = useSocket({
    token,
    autoConnect: !!token,
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3000/rent-requests', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Lấy danh sách yêu cầu thất bại');
        }

        const list = Array.isArray(result) ? result : result.data || [];
        setRequests(list);
      } catch (error: any) {
        setErrorMessage(error.message || 'Lỗi kết nối server');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchRequests();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const unsubscribe = on('new-rent-request', (newRequest: any) => {
      setRequests((prev) => [newRequest, ...prev]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [on, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const handleUpdateStatus = async (id: string, status: 'PENDING' | 'CONTACTED' | 'CANCELLED') => {
    try {
      const res = await fetch(`http://localhost:3000/rent-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa đăng ký này?')) return;
    try {
      const res = await fetch(`http://localhost:3000/rent-requests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(requests.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
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
      const res = await fetch(`http://localhost:3000/rent-requests/${selectedReq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setRequests(requests.map(r => r.id === selectedReq.id ? { ...r, ...formData } : r));
        setShowEditModal(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openCreateTenantModal = (req: RentRequest) => {
    setInlineError('');
    setCreateTenantData({
      name: req.name,
      phone: req.phone,
      email: req.email,
      password: 'password123'
    });
    setShowCreateTenantModal(true);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTenant(true);
    try {
      const res = await fetch('http://localhost:3000/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createTenantData)
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã tạo tài khoản Khách thuê', duration: 3000 });
        setShowCreateTenantModal(false);
      } else {
        setInlineError(result.message || 'Lỗi tạo khách thuê');
        toast({ title: 'Lỗi', description: result.message || 'Lỗi tạo khách thuê', duration: 3000 });
      }
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Lỗi kết nối', duration: 3000 });
    } finally {
      setCreatingTenant(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>Danh sách đăng ký tư vấn</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Quản lý các yêu cầu tư vấn thuê phòng từ khách hàng (Cập nhật thời gian thực)
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tổng số yêu cầu</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>{requests.length}</div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải danh sách...</div>
        ) : errorMessage ? (
          <div style={{ padding: '20px', margin: '20px', background: 'var(--status-error-bg)', color: 'var(--status-error-text)', borderRadius: '8px', fontSize: '0.9rem' }}>
            {errorMessage}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có yêu cầu tư vấn nào được gửi.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Khách hàng</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Liên hệ</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Lời nhắn</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Thời gian</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Trạng thái</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => (
                  <tr 
                    key={req.id} 
                    className="animate-slide-in"
                    style={{ 
                      borderBottom: idx !== requests.length - 1 ? '1px solid var(--border-color)' : 'none',
                      transition: 'background 0.2s',
                      animationDelay: `${idx * 0.05}s`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{req.name}</div>
                      {req.room && (
                        <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: 'var(--primary-glow)', color: '#fff', fontSize: '0.75rem' }}>
                          Phòng: {req.room.roomNumber}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '500' }}>{req.phone}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.email}</div>
                      {req.hasExistingAccount && (
                        <div style={{ marginTop: '6px', display: 'inline-block', padding: '2px 8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          Đã có TK: {req.existingUserStatus === 'PENDING' ? 'Chờ duyệt' : req.existingUserStatus === 'APPROVED' ? 'Đã duyệt' : req.existingUserStatus}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', maxWidth: '300px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.message}>
                        {req.message || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Không có lời nhắn</span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatDate(req.createdAt)}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <select 
                        value={req.status}
                        onChange={(e) => handleUpdateStatus(req.id, e.target.value as any)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: req.status === 'PENDING' ? 'var(--status-pending-bg)' : 'rgba(34, 197, 94, 0.1)',
                          color: req.status === 'PENDING' ? 'var(--status-pending-text)' : '#22c55e',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="PENDING" style={{ background: '#1a1a1a', color: '#fff' }}>Chờ liên hệ</option>
                        <option value="CONTACTED" style={{ background: '#1a1a1a', color: '#fff' }}>Đã liên hệ</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      {req.hasExistingAccount ? (
                          <button 
                            onClick={() => window.location.href = '/admin/tenants'}
                            style={{ background: 'transparent', border: 'none', color: '#8b5cf6', cursor: 'pointer', marginRight: '10px', fontSize: '0.85rem', fontWeight: '500' }}
                          >Quản lý Khách</button>
                        ) : (
                          <button 
                            onClick={() => openCreateTenantModal(req)}
                            style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', marginRight: '10px', fontSize: '0.85rem', fontWeight: '500' }}
                          >Tạo Khách</button>
                        )}
                      <button 
                        onClick={() => openEditModal(req)}
                        style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '10px', fontSize: '0.85rem', fontWeight: '500' }}
                      >Sửa</button>
                      <button 
                        onClick={() => handleDelete(req.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
                      >Xóa</button>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '30px', margin: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px' }}>Sửa Thông tin Khách hàng</h2>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Tên khách hàng</label>
                <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Số điện thoại</label>
                <input required className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Lời nhắn</label>
                <textarea className="form-input" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} style={{ minHeight: '80px', resize: 'vertical' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateTenantModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '30px', margin: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px' }}>Tạo Tài khoản Khách Thuê</h2>
            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Tên khách hàng</label>
                <input required className="form-input" value={createTenantData.name} onChange={e => setCreateTenantData({...createTenantData, name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Số điện thoại</label>
                <input required className="form-input" value={createTenantData.phone} onChange={e => setCreateTenantData({...createTenantData, phone: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input required type="email" className="form-input" value={createTenantData.email} onChange={e => {setCreateTenantData({...createTenantData, email: e.target.value}); setInlineError('');}} />
                {inlineError && <div className="animate-fade-in" style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '6px', fontWeight: '500' }}>⚠️ {inlineError}</div>}
              </div>
              <div>
                <label className="form-label">Mật khẩu (Khách dùng để đăng nhập)</label>
                <input required type="text" minLength={6} className="form-input" value={createTenantData.password} onChange={e => setCreateTenantData({...createTenantData, password: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateTenantModal(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Hủy</button>
                <button type="submit" disabled={creatingTenant} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
                  {creatingTenant ? 'Đang tạo...' : 'Tạo Tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
