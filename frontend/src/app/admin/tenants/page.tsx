'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '../../../components/ui/use-toast';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const { toast } = useToast();
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : '';

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:3000/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
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
      const res = await fetch('http://localhost:3000/tenants', {
        method: 'POST',
        headers: {
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
      const res = await fetch(`http://localhost:3000/tenants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
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

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN');

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
          onClick={() => setShowAddModal(true)}
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
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatDate(t.createdAt)}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
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
                <input required type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
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
    </div>
  );
}
