'use client';

import React, { useState, useEffect } from 'react';
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

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTenantInfo, setSelectedTenantInfo] = useState<Tenant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });



  const { toast } = useToast();
  const { token } = useAuth();

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:3000/tenants', { cache: "no-store", headers: { 'Authorization': `Bearer ${token}` }
      });
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

  useEffect(() => {
    if (token) fetchTenants();
  }, [token]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3000/tenants', { method: 'POST', cache: "no-store", headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã thêm khách thuê mới', duration: 3000 });
        setShowAddModal(false);
        setFormData({ name: '', email: '', phone: '', password: '' });
        fetchTenants(); // Refresh list
      } else {
        setInlineError(result.message || 'Thêm thất bại');
        toast({ title: 'Lỗi', description: result.message || 'Thêm thất bại', duration: 3000 });
      }
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể kết nối đến server', duration: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa khách thuê ${name} không? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/tenants/${id}`, { method: 'DELETE', cache: "no-store", headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã xóa khách thuê', duration: 3000 });
        setTenants(tenants.filter(t => t.id !== id));
      } else {
        const result = await res.json();
        toast({ title: 'Lỗi', description: result.message || 'Xóa thất bại', duration: 3000 });
      }
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể kết nối đến server', duration: 3000 });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:3000/tenants/${id}/status`, { method: 'PATCH', cache: "no-store", headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã cập nhật trạng thái', duration: 3000 });
        setTenants(tenants.map(t => t.id === id ? { ...t, status: newStatus } : t));
      } else {
        const result = await res.json();
        toast({ title: 'Lỗi', description: result.message || 'Cập nhật thất bại', duration: 3000 });
      }
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể kết nối đến server', duration: 3000 });
    }
  };



  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('vi-VN');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>Quản lý Khách Thuê</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Quản lý danh sách nhân khẩu, tài khoản người dùng trực thuộc hệ thống trọ của bạn.
          </p>
        </div>
        <button 
          onClick={() => { setInlineError(''); setShowAddModal(true); }}
          className="btn-primary" 
          style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.9rem' }}
        >
          + Thêm khách thuê
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải danh sách...</div>
        ) : tenants.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có khách thuê nào. Hãy thêm khách thuê mới!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Họ và Tên</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Thông tin liên hệ</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Trạng thái</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Ngày tham gia</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t, idx) => (
                  <tr 
                    key={t.id} 
                    className="animate-slide-in"
                    style={{ 
                      borderBottom: idx !== tenants.length - 1 ? '1px solid var(--border-color)' : 'none',
                      transition: 'background 0.2s',
                      animationDelay: `${idx * 0.05}s`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{t.name}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '500' }}>{t.phone}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {t.status === 'PENDING' ? (
                        <span style={{ padding: '4px 8px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Chờ duyệt</span>
                      ) : t.status === 'APPROVED' ? (
                        <span style={{ padding: '4px 8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Đã duyệt</span>
                      ) : (
                        <span style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>{t.status}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatDate(t.createdAt)}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {t.status === 'PENDING' && (
                        <button 
                          onClick={() => handleUpdateStatus(t.id, 'APPROVED')}
                          style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'}
                        >
                          Duyệt
                        </button>
                      )}
                      {t.status === 'APPROVED' && (
                        <Link 
                          href={`/admin/contracts?tenantId=${t.id}`}
                          style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
                        >
                          Tạo HĐ
                        </Link>
                      )}
                      <button 
                        onClick={() => setSelectedTenantInfo(t)}
                        style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'}
                      >
                        Tài khoản
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id, t.name)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                      >
                        Xóa
                      </button>

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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '30px', margin: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px' }}>Thêm Khách Thuê Mới</h2>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Họ và tên</label>
                <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input required type="email" className="form-input" value={formData.email} onChange={e => {setFormData({...formData, email: e.target.value}); setInlineError('');}} placeholder="email@example.com" />
                {inlineError && <div className="animate-fade-in" style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '6px', fontWeight: '500' }}>⚠️ {inlineError}</div>}
              </div>
              <div>
                <label className="form-label">Số điện thoại</label>
                <input required className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="0901234567" />
              </div>
              <div>
                <label className="form-label">Mật khẩu (Tùy chọn)</label>
                <input type="password" minLength={6} className="form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Mặc định là password123" />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Khách thuê có thể dùng email và mật khẩu này để đăng nhập.</div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Hủy</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
                  {isSubmitting ? 'Đang thêm...' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Account Info Modal */}
      {selectedTenantInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '30px', margin: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px' }}>Thông tin đăng nhập</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ color: 'var(--text-muted)' }}>Khách thuê</label>
                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{selectedTenantInfo.name}</div>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-muted)' }}>Tài khoản (Email)</label>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', userSelect: 'all' }}>
                  {selectedTenantInfo.email}
                </div>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-muted)' }}>Mật khẩu</label>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#eab308' }}>*** Đã mã hóa bảo mật ***</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                    Mật khẩu mặc định khi tạo tài khoản là: <strong>password123</strong> (nếu bạn không tự nhập mật khẩu khác).<br/>
                    Vì lý do bảo mật, hệ thống không lưu mật khẩu dưới dạng văn bản.
                  </p>
                </div>
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => setSelectedTenantInfo(null)} className="btn-primary" style={{ width: '100%', padding: '10px', borderRadius: '8px' }}>
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
