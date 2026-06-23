'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đăng nhập thành công!', duration: 3000 });
        login(data.data.access_token, data.data.user);
        
        // Redirect based on role
        if (data.data.user.role === 'ADMIN' || data.data.user.role === 'LANDLORD') {
          router.push('/dashboard');
        } else {
          router.push('/tenant');
        }
      } else {
        toast({ title: 'Lỗi', description: data.message || 'Đăng nhập thất bại', duration: 3000 });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể kết nối đến server.', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', position: 'relative' }}>
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', background: '#ec4899', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }} />

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }} className="text-gradient">Đăng Nhập</h1>
          <p style={{ color: 'var(--text-muted)' }}>Chào mừng bạn quay lại hệ thống</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="form-label">Email</label>
            <input 
              required 
              type="email" 
              className="form-input" 
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Mật khẩu</label>
            <input 
              required 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px', marginTop: '10px' }}>
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Chưa có tài khoản?{' '}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Đăng ký ngay</Link>
        </div>
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.85rem' }}>Quay về trang chủ</Link>
        </div>
      </div>
    </div>
  );
}
