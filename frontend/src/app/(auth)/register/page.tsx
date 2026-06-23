'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components/ui/use-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const [role, setRole] = useState<'TENANT' | 'LANDLORD'>('TENANT');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    landlordName: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role,
      };

      if (role === 'LANDLORD') {
        payload.landlordName = formData.landlordName || formData.name;
      }

      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đăng ký thành công! Vui lòng đăng nhập.', duration: 5000 });
        router.push('/login');
      } else {
        toast({ title: 'Lỗi', description: typeof data.message === 'string' ? data.message : (data.message?.[0] || 'Đăng ký thất bại'), duration: 5000 });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể kết nối đến server.', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', position: 'relative', padding: '40px 20px' }}>
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: '400px', height: '400px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '400px', height: '400px', background: '#ec4899', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }} />

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '40px', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }} className="text-gradient">Tạo Tài Khoản</h1>
          <p style={{ color: 'var(--text-muted)' }}>Tham gia cùng hàng ngàn người dùng khác</p>
        </div>

        {/* Role Selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '12px' }}>
          <button 
            type="button"
            onClick={() => setRole('TENANT')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s', background: role === 'TENANT' ? 'var(--primary)' : 'transparent', color: role === 'TENANT' ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
          >
            Khách Thuê
          </button>
          <button 
            type="button"
            onClick={() => setRole('LANDLORD')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s', background: role === 'LANDLORD' ? 'var(--primary)' : 'transparent', color: role === 'LANDLORD' ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
          >
            Chủ Trọ
          </button>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Họ và Tên</label>
            <input required name="name" type="text" className="form-input" placeholder="Nguyễn Văn A" value={formData.name} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input required name="email" type="email" className="form-input" placeholder="email@example.com" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Số điện thoại</label>
            <input required name="phone" type="tel" className="form-input" placeholder="0901234567" value={formData.phone} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Mật khẩu</label>
            <input required name="password" type="password" className="form-input" placeholder="Ít nhất 6 ký tự" minLength={6} value={formData.password} onChange={handleChange} />
          </div>

          {role === 'LANDLORD' && (
            <div className="animate-fade-in">
              <label className="form-label">Tên khu trọ / Thương hiệu</label>
              <input required name="landlordName" type="text" className="form-input" placeholder="VD: Trọ Minh Tiến" value={formData.landlordName} onChange={handleChange} />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px', marginTop: '16px' }}>
            {loading ? 'Đang đăng ký...' : 'Đăng Ký Ngay'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Đã có tài khoản?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Đăng nhập</Link>
        </div>
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.85rem' }}>Quay về trang chủ</Link>
        </div>
      </div>
    </div>
  );
}
