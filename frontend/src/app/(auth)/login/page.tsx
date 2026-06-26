'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('https://thesis-2rkn.onrender.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đăng nhập thành công!', duration: 3000 });
        login(data.data.access_token, data.data.user, rememberMe);
        if (data.data.user.role === 'ADMIN' || data.data.user.role === 'LANDLORD') {
          router.push('/admin');
        } else {
          router.push('/tenant');
        }
      } else {
        toast({ title: 'Lỗi', description: data.message || 'Đăng nhập thất bại', duration: 3000 });
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể kết nối đến server.', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '⚡', text: 'Quản lý phòng trọ tự động hóa 100%' },
    { icon: '💳', text: 'Thanh toán hóa đơn trực tuyến tức thì' },
    { icon: '🛡️', text: 'Bảo mật dữ liệu theo chuẩn enterprise' },
    { icon: '📊', text: 'Báo cáo tài chính thời gian thực' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        
        .login-input {
          width: 100%;
          padding: 14px 18px 14px 46px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.1);
          color: white;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        }
        .login-input::placeholder { color: rgba(255,255,255,0.25); }
        .login-input:focus {
          border-color: rgba(124,58,237,0.7);
          background: rgba(124,58,237,0.06);
          box-shadow: 0 0 0 4px rgba(124,58,237,0.12);
        }
        
        .login-btn {
          width: 100%;
          padding: 15px;
          border-radius: 13px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: -0.01em;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          box-shadow: 0 6px 24px rgba(124,58,237,0.4);
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(124,58,237,0.6);
        }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .login-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          transition: left 0.5s ease;
        }
        .login-btn:hover::before { left: 100%; }
        
        .left-panel {
          position: relative;
          background: var(--bg-light-base);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 72px;
          overflow: hidden;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.25s;
        }
        .feature-item:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.12);
          transform: translateX(4px);
        }
        
        .right-panel {
          background: #0D1220;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 56px;
          border-left: 1px solid rgba(255,255,255,0.06);
        }

        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .anim-1 { animation: fadeUp 0.6s 0s both; }
        .anim-2 { animation: fadeUp 0.6s 0.1s both; }
        .anim-3 { animation: fadeUp 0.6s 0.15s both; }
        .anim-4 { animation: fadeUp 0.6s 0.2s both; }
        .anim-5 { animation: fadeUp 0.6s 0.25s both; }
        
        .floating-card {
          position: absolute;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
      `}</style>

      {/* ── Left Brand Panel ──────────────────────────────── */}
      <div className="left-panel">
        {/* Mesh gradient background */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(124,58,237,0.2) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(6,182,212,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
        {/* Grid pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />

        {/* Floating stats cards */}
        <div className="floating-card" style={{ top: 100, right: 40 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>📈</div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-light-main)', fontSize: '0.88rem' }}>+142 khách</div>
            <div style={{ color: 'var(--text-light-muted)', fontSize: '0.7rem' }}>tháng này</div>
          </div>
        </div>
        <div className="floating-card" style={{ bottom: 120, right: 32 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-light-muted)', fontSize: '0.78rem' }}>99.9% uptime</div>
        </div>
        <div className="floating-card" style={{ bottom: 220, left: 40, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-light-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Doanh thu tháng 6</div>
          <div style={{ fontWeight: 900, color: '#a78bfa', fontSize: '1.1rem' }}>142.500.000 đ</div>
          <div style={{ width: '100%', height: 4, background: 'var(--bg-light-surface-alt)', borderRadius: 999 }}>
            <div style={{ width: '78%', height: '100%', background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 999 }} />
          </div>
        </div>

        {/* Main content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56, textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.5)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-light-main)', letterSpacing: '-0.03em' }}>
              SaaS<span style={{ color: '#a78bfa' }}> Rent</span>
            </span>
          </a>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd', fontSize: '0.78rem', fontWeight: 600, marginBottom: 24 }}>
            🏆 Nền tảng số 1 cho chủ nhà trọ Việt Nam
          </div>

          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text-light-main)', lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 20 }}>
            Quản lý nhà trọ<br />
            <span style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>thông minh hơn</span>
          </h1>

          <p style={{ color: 'var(--text-light-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: 40 }}>
            Tự động hóa toàn bộ quy trình từ ký hợp đồng, thu tiền thuê đến xử lý sự cố. Tiết kiệm 10 giờ mỗi tuần.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {features.map((f, i) => (
              <div key={i} className="feature-item">
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{f.icon}</span>
                <span style={{ color: 'var(--text-light-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{ marginTop: 40, padding: '20px 22px', background: 'var(--bg-light-surface)', border: '1px solid var(--border-light)', borderRadius: 16 }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#fbbf24', fontSize: '0.9rem' }}>★</span>)}
            </div>
            <p style={{ color: 'var(--text-light-muted)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: 14, fontStyle: 'italic' }}>
              "NestPro đã giúp tôi tự động hóa việc quản lý 30 phòng trọ. Giờ tôi chỉ cần 30 phút mỗi tuần cho công việc hành chính."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light-main)', fontWeight: 800, fontSize: '0.72rem' }}>NVA</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-light-main)', fontSize: '0.84rem' }}>Nguyễn Văn An</div>
                <div style={{ color: 'var(--text-light-muted)', fontSize: '0.74rem' }}>Chủ nhà trọ · Hà Nội</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ──────────────────────────────── */}
      <div className="right-panel">
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Header */}
          <div className="anim-1" style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-light-main)', letterSpacing: '-0.03em', marginBottom: 8 }}>
              Chào mừng trở lại
            </h2>
            <p style={{ color: 'var(--text-light-muted)', fontSize: '0.95rem' }}>
              Đăng nhập để tiếp tục quản lý hệ thống
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="anim-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Email / Tài khoản
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light-muted)', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  required
                  type="text"
                  className="login-input"
                  placeholder="admin hoặc email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Mật khẩu
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light-muted)', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light-muted)', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="anim-3" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                onClick={() => setRememberMe(!rememberMe)}
                style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${rememberMe ? '#7c3aed' : 'rgba(255,255,255,0.2)'}`, background: rememberMe ? 'rgba(124,58,237,0.8)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
              >
                {rememberMe && <svg viewBox="0 0 12 10" fill="none" style={{ width: 10 }}><path d="M1 5l3 3.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <label onClick={() => setRememberMe(!rememberMe)} style={{ fontSize: '0.88rem', color: 'var(--text-light-muted)', cursor: 'pointer', userSelect: 'none' }}>
                Ghi nhớ đăng nhập trong 30 ngày
              </label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="login-btn anim-4">
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  Đang xác thực...
                </span>
              ) : 'Đăng nhập →'}
            </button>
          </form>

          {/* Divider */}
          <div className="anim-5" style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '28px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--bg-light-surface-alt)' }} />
            <span style={{ color: 'var(--text-light-muted)', fontSize: '0.78rem', fontWeight: 500 }}>hoặc</span>
            <div style={{ flex: 1, height: 1, background: 'var(--bg-light-surface-alt)' }} />
          </div>

          {/* Back to home */}
          <div className="anim-5" style={{ textAlign: 'center' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-light-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, transition: 'color 0.2s', borderRadius: 8, padding: '8px 14px', border: '1px solid var(--border-light)', background: 'var(--bg-light-surface-alt)' }}
              onMouseEnter={e => (e.currentTarget as any).style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => (e.currentTarget as any).style.color = 'rgba(255,255,255,0.35)'}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 15, height: 15 }}>
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              Quay về trang chủ
            </Link>
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-light-muted)', fontSize: '0.75rem', lineHeight: 1.6 }}>
              Bằng việc đăng nhập, bạn đồng ý với{' '}
              <Link href="#" style={{ color: 'rgba(124,58,237,0.6)', textDecoration: 'underline', cursor: 'pointer' }}>Điều khoản dịch vụ</Link>
              {' '}và{' '}
              <Link href="#" style={{ color: 'rgba(124,58,237,0.6)', textDecoration: 'underline', cursor: 'pointer' }}>Chính sách bảo mật</Link>
              {' '}của NestPro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
