'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

interface Room {
  id: string;
  roomNumber: string;
  price: string;
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  description: string;
  imageUrls: string[];
}

export default function LandingPage() {
  const landlordId = 'e29d665b-efbe-40b3-bb66-df30bd5e8bf8';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '', roomId: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const formRef = useRef<HTMLDivElement>(null);
  const roomsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Xin chào! 👋 Tôi là **RentBot**, trợ lý AI của NestPro.\n\nTôi có thể giúp bạn tìm phòng phù hợp, tư vấn giá cả và thời gian thuê tốt nhất. Bạn muốn hỏi gì?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const QUICK_QUESTIONS = ['🏠 Phòng nào còn trống?', '💰 Giá thuê bao nhiêu?', '🎓 Phòng nào cho sinh viên?', '📅 Nên thuê bao lâu?'];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSendChat = async (text?: string) => {
    const message = text || chatInput.trim();
    if (!message || isChatLoading) return;
    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ai/public-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: data.text || 'Xin lỗi, tôi không thể trả lời lúc này.' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: '⚠️ Lỗi kết nối. Vui lòng thử lại.' }]);
    } finally { setIsChatLoading(false); }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/rooms/public`);
        if (response.ok) { const data = await response.json(); setRooms(data); }
      } catch (error) { console.error('Failed to fetch rooms:', error); }
      finally { setLoadingRooms(false); }
    };
    fetchRooms();
  }, []);

  const handleSelectRoom = (roomId: string) => {
    setFormData(prev => ({ ...prev, roomId }));
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    toast({ title: 'Đã chọn phòng', description: 'Vui lòng điền thông tin bên dưới để gửi yêu cầu.', duration: 3000 });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/rent-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone, message: formData.message || undefined, landlordId, roomId: formData.roomId || undefined }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Đã xảy ra lỗi');
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '', roomId: '' });
      toast({ title: '✅ Gửi thành công!', description: 'Chúng tôi sẽ liên hệ bạn sớm nhất!', duration: 5000 });
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Kết nối server thất bại');
    }
  };

  const formatCurrency = (amount: string | number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
  const selectedRoomDetails = rooms.find(r => r.id === formData.roomId);
  const { user, logout } = useAuth();

  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 10.096a11.958 11.958 0 005.957 10.461A11.96 11.96 0 0012 21.5c2.042 0 3.97-.52 5.656-1.443A11.96 11.96 0 0021 10.095a11.955 11.955 0 00-.598-4.096A11.959 11.959 0 0015 3.464M12 4.5V3" />
        </svg>
      ),
      title: 'An Ninh 24/7',
      desc: 'Camera AI giám sát toàn bộ khuôn viên, khóa vân tay thế hệ mới đảm bảo an toàn tuyệt đối cho cư dân.',
      gradient: 'from-blue-500 to-indigo-600',
      glow: 'rgba(99,102,241,0.3)',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
      title: 'Tiện Nghi Đầy Đủ',
      desc: 'Nội thất cao cấp, điều hòa, tủ lạnh, máy giặt riêng — không gian sống đầy đủ như căn hộ cao cấp.',
      gradient: 'from-violet-500 to-purple-600',
      glow: 'rgba(139,92,246,0.3)',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      title: 'Wifi Tốc Độ Cao',
      desc: 'Internet cáp quang đối xứng 1Gbps, không giới hạn băng thông. Lý tưởng cho làm việc và giải trí.',
      gradient: 'from-cyan-500 to-teal-600',
      glow: 'rgba(6,182,212,0.3)',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      ),
      title: 'Quản Lý Thông Minh',
      desc: 'Thanh toán trực tuyến, báo cáo sự cố qua app, theo dõi hợp đồng 24/7 — mọi thứ trong tầm tay.',
      gradient: 'from-rose-500 to-pink-600',
      glow: 'rgba(244,63,94,0.3)',
    },
  ];

  const testimonials = [
    { name: 'Nguyễn Minh Tuấn', role: 'Kỹ sư phần mềm', text: 'Hệ thống quản lý phòng trọ tốt nhất tôi từng dùng. Thanh toán tiền nhà qua app cực kỳ tiện lợi, chủ nhà phản hồi nhanh chóng.', avatar: 'NMT', color: '#6366f1' },
    { name: 'Trần Thị Lan Anh', role: 'Sinh viên đại học', text: 'Phòng sạch, an ninh tốt, wifi nhanh. Chủ trọ dùng app nên mọi vấn đề được giải quyết ngay, không cần đợi lâu như các nơi khác.', avatar: 'TLA', color: '#a855f7' },
    { name: 'Lê Hoàng Phúc', role: 'Nhân viên văn phòng', text: 'Đã thuê 2 năm, hài lòng tuyệt đối. Giá cả hợp lý, tiện nghi đầy đủ. Đặc biệt thích tính năng báo cáo sự cố qua app.', avatar: 'LHP', color: '#06b6d4' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        
        .lp-nav { transition: all 0.4s ease; }
        .lp-nav.scrolled { background: rgba(255,255,255,0.95) !important; backdrop-filter: blur(24px) !important; box-shadow: 0 1px 0 rgba(255,255,255,0.06) !important; }
        
        .hero-badge { animation: fadeSlideUp 0.7s ease both; }
        .hero-title { animation: fadeSlideUp 0.7s 0.1s ease both; }
        .hero-sub { animation: fadeSlideUp 0.7s 0.2s ease both; }
        .hero-btns { animation: fadeSlideUp 0.7s 0.3s ease both; }
        .hero-stats { animation: fadeSlideUp 0.7s 0.4s ease both; }
        .hero-img { animation: fadeSlideLeft 0.9s 0.2s ease both; }
        
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeSlideLeft { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        
        .feat-card { transition: transform 0.35s ease, box-shadow 0.35s ease; }
        .feat-card:hover { transform: translateY(-10px); }
        
        .room-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .room-card:hover { transform: translateY(-8px); box-shadow: 0 24px 60px rgba(0,0,0,0.5) !important; }
        .room-card:hover .room-img { transform: scale(1.05); }
        .room-img { transition: transform 0.5s ease; }
        
        .btn-lp-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 16px 36px; border-radius: 14px; border: none; cursor: pointer;
          font-family: inherit; font-weight: 700; font-size: 1rem; letter-spacing: -0.01em;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white; box-shadow: 0 8px 30px rgba(124,58,237,0.4);
          transition: all 0.25s ease; text-decoration: none;
        }
        .btn-lp-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(124,58,237,0.6); background: linear-gradient(135deg, #6d28d9, #4338ca); }
        
        .btn-lp-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 16px 36px; border-radius: 14px; cursor: pointer;
          font-family: inherit; font-weight: 600; font-size: 1rem;
          background: var(--bg-light-surface-alt); color: var(--text-light-main);
          border: 1px solid var(--border-light);
          transition: all 0.25s ease; text-decoration: none;
        }
        .btn-lp-ghost:hover { background: var(--bg-light-surface); border-color: #cbd5e1; transform: translateY(-2px); box-shadow: var(--neo-shadow); }
        
        .mesh-gradient {
          position: absolute; inset: 0; z-index: 0;
          background: 
            radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.25) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 60%, rgba(6,182,212,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 10% 80%, rgba(99,102,241,0.15) 0%, transparent 50%);
        }
        
        .grid-pattern {
          position: absolute; inset: 0; z-index: 0;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
        }

        .testimonial-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .testimonial-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,0.4) !important; }
        
        .lp-input {
          width: 100%; padding: 14px 18px; border-radius: 12px; font-size: 0.95rem; font-family: inherit;
          background: var(--bg-light-surface); border: 1px solid var(--border-light);
          color: var(--text-light-main); outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .lp-input::placeholder { color: var(--text-light-muted); }
        .lp-input:focus { border-color: rgba(124,58,237,0.6); box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
        
        .tag-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 16px; border-radius: 999px;
          background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.3);
          color: #6d28d9; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.02em;
        }
        
        .section-label {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 999px;
          background: var(--bg-light-surface-alt); border: 1px solid var(--border-light);
          color: var(--text-light-muted); font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 16px;
        }

        /* Responsive Styles */
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; text-align: center; }
          .hero-grid > div:first-child { display: flex; flex-direction: column; align-items: center; }
          .hero-grid .hero-sub { margin-left: auto; margin-right: auto; }
          .hero-grid .hero-btns { justify-content: center; }
          .hero-grid .hero-stats { justify-content: center; }
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .testimonials-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .footer-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 768px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .rooms-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .lp-nav-links { display: none !important; }
          .lp-nav-cta { gap: 6px !important; }
          .lp-nav-cta a, .lp-nav-cta button { padding: 8px 12px !important; font-size: 0.8rem !important; }
          .hero-title { font-size: 2.5rem !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          section { padding: 60px 24px !important; }
          .hero-grid { padding: 100px 24px 40px !important; }
          .lp-nav-container { padding: 14px 20px !important; }
        }
      `}</style>

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <header
        className={`lp-nav ${scrolled ? 'scrolled' : ''}`}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', flexDirection: 'column' }}
      >
        <div className="lp-nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 48px', width: '100%' }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(124,58,237,0.5)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-light-main)', letterSpacing: '-0.03em' }}>
            SaaS<span style={{ color: '#a78bfa' }}> Rent</span>
          </span>
        </a>

        {/* Nav Links */}
        <nav className="lp-nav-links" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[
            { label: 'Tính năng', href: '#features' },
            { label: 'Phòng trống', href: '#rooms' },
            { label: 'Liên hệ', href: '#contact' },
          ].map(item => (
            <a key={item.label} href={item.href} style={{ padding: '8px 14px', color: 'var(--text-light-muted)', fontSize: '0.9rem', fontWeight: 600, borderRadius: 8, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-light-main)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-light-muted)'}
            >{item.label}</a>
          ))}
        </nav>

        {/* CTA */}
        <div className="lp-nav-cta" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ color: 'var(--text-light-muted)', fontSize: '0.88rem' }}>Hi, <strong style={{ color: 'var(--text-light-main)' }}>{user.name}</strong></span>
              {(user.role === 'ADMIN' || user.role === 'LANDLORD') && <Link href="/admin" className="btn-lp-primary" style={{ padding: '9px 18px', fontSize: '0.88rem' }}>Dashboard</Link>}
              {user.role === 'TENANT' && <Link href="/tenant" className="btn-lp-primary" style={{ padding: '9px 18px', fontSize: '0.88rem' }}>Phòng Của Tôi</Link>}
              <button onClick={logout} style={{ padding: '9px 16px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.2s' }}>Đăng Xuất</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ padding: '9px 18px', color: 'var(--text-light-muted)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', borderRadius: 10, transition: 'color 0.2s' }}
                onMouseLeave={e => (e.currentTarget as any).style.color = 'rgba(255,255,255,0.7)'}
              >Đăng Nhập</Link>
              <button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} className="btn-lp-primary" style={{ padding: '9px 20px', fontSize: '0.9rem' }}>
                Đăng Ký Thuê →
              </button>
            </>
          )}
        </div>
        </div>

        {/* Bottom Decorative Line */}
        <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.8) 20%, rgba(79,70,229,0.8) 50%, rgba(6,182,212,0.8) 80%, transparent 100%)', boxShadow: '0 1px 12px rgba(124,58,237,0.5)' }} />
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'var(--bg-light-base)' }}>
        
        <div className="grid-pattern" />

        <div className="hero-grid" style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 48px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
          {/* Left: Text */}
          <div>
            <div className="hero-badge tag-badge" style={{ marginBottom: 24 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', flexShrink: 0 }} />
              Hệ thống quản lý nhà trọ thông minh #1
            </div>

            <h1 className="hero-title" style={{ fontSize: '3.8rem', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em', color: 'var(--text-light-main)', marginBottom: 24 }}>
              Sống đẳng cấp,<br />
              <span style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                quản lý thông minh
              </span>
            </h1>

            <p className="hero-sub" style={{ fontSize: '1.15rem', color: '#475569', fontWeight: 500, lineHeight: 1.75, marginBottom: 40, maxWidth: 480 }}>
              Nền tảng thuê & quản lý phòng trọ tự động hóa 100%. Thanh toán online, báo cáo sự cố, theo dõi hợp đồng — tất cả trong một app.
            </p>

            <div className="hero-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 52 }}>
              <button onClick={() => roomsRef.current?.scrollIntoView({ behavior: 'smooth' })} className="btn-lp-primary">
                Xem phòng trống
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
              </button>
              <button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} className="btn-lp-ghost">
                Đăng ký tư vấn
              </button>
            </div>

            {/* Stats */}
            <div className="hero-stats" style={{ display: 'flex', gap: 32, padding: '20px 0', borderTop: '1px solid var(--border-light)' }}>
              {[
                { value: '500+', label: 'Khách hài lòng' },
                { value: '50+', label: 'Phòng quản lý' },
                { value: '99.9%', label: 'Uptime hệ thống' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-light-main)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard Mockup */}
          <div className="hero-img" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-20%', background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.2) 0%, transparent 70%)', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)', transform: 'perspective(1200px) rotateY(-8deg) rotateX(3deg)', transition: 'transform 0.5s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'perspective(1200px) rotateY(-4deg) rotateX(1deg) scale(1.01)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'perspective(1200px) rotateY(-8deg) rotateX(3deg)'}
            >
              <img src="/dashboard-mockup.png" alt="NestPro Dashboard" style={{ width: '100%', display: 'block' }} />
              {/* Shine overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)', pointerEvents: 'none' }} />
            </div>
            {/* Floating badge */}
            <div style={{ position: 'absolute', bottom: -20, left: -24, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-light)', borderRadius: 16, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, zIndex: 2, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>✅</div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light-main)' }}>Hóa đơn đã thu</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-light-muted)' }}>Vừa xong · tháng 6/2026</div>
              </div>
            </div>
            <div style={{ position: 'absolute', top: -16, right: -20, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-light)', borderRadius: 16, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 2, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light-main)' }}>98% Tỉ lệ thanh toán đúng hạn</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-light-muted)', fontSize: '0.72rem', fontWeight: 500 }}>
          <div style={{ width: 24, height: 40, border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
            <div style={{ width: 3, height: 8, background: 'var(--bg-light-surface-alt)', borderRadius: 999, animation: 'scrollDot 2s ease infinite' }} />
          </div>
          Cuộn xuống
          <style>{`@keyframes scrollDot { 0%,100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(6px); opacity: 0.3; } }`}</style>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: '120px 48px', background: 'var(--bg-light-base)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 600, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="section-label" style={{ display: 'inline-flex', marginBottom: 16 }}>✦ Tính năng</div>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-light-main)', letterSpacing: '-0.03em', marginBottom: 16 }}>
              Mọi thứ bạn cần<br />
              <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>trong một nền tảng</span>
            </h2>
            <p style={{ color: 'var(--text-light-muted)', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto' }}>
              Được thiết kế để tối ưu trải nghiệm cho cả chủ nhà lẫn người thuê
            </p>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {features.map((feat, i) => (
              <div key={i} className="feat-card" style={{ padding: '32px 28px', borderRadius: 20, background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', cursor: 'default', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${feat.glow}, transparent)` }} />
                <div style={{ width: 54, height: 54, borderRadius: 14, background: `${feat.glow.replace('0.3', '0.15')}`, border: `1px solid ${feat.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light-main)', marginBottom: 20 }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-light-main)', marginBottom: 10 }}>{feat.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-light-muted)', lineHeight: 1.7 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rooms Section ────────────────────────────────────────────── */}
      <section id="rooms" ref={roomsRef} style={{ padding: '120px 48px', background: 'var(--bg-light-surface)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="section-label" style={{ display: 'inline-flex', marginBottom: 16 }}>🏠 Phòng cho thuê</div>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-light-main)', letterSpacing: '-0.03em', marginBottom: 16 }}>Phòng đang có sẵn</h2>
            <p style={{ color: 'var(--text-light-muted)', fontSize: '1.05rem' }}>Tham quan các lựa chọn phù hợp nhất với nhu cầu của bạn</p>
          </div>

          {loadingRooms ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ width: 40, height: 40, border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
              <div style={{ color: 'var(--text-light-muted)', fontSize: '0.9rem' }}>Đang tải...</div>
            </div>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-light-muted)', padding: 60, fontSize: '0.95rem' }}>Hiện tại không có phòng nào trong hệ thống.</div>
          ) : (
            <div className="rooms-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
              {rooms.map((room) => (
                <div key={room.id} className="room-card" style={{ borderRadius: 20, background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Image */}
                  <div style={{ height: 220, position: 'relative', overflow: 'hidden', background: 'var(--bg-light-surface-alt)' }}>
                    {room.imageUrls && room.imageUrls.length > 0 ? (
                      <img className="room-img" src={room.imageUrls[0]} alt={`Phòng ${room.roomNumber}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: room.status === 'VACANT' ? 1 : 0.5 }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light-muted)', fontSize: '2.5rem' }}>🏠</div>
                    )}
                    {/* Gradient overlay */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(transparent, rgba(255,255,255,0.95))' }} />
                    {/* Status badge */}
                    <div style={{ position: 'absolute', top: 14, right: 14, padding: '5px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(12px)',
                      background: room.status === 'VACANT' ? 'rgba(34,197,94,0.2)' : room.status === 'OCCUPIED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                      color: room.status === 'VACANT' ? '#4ade80' : room.status === 'OCCUPIED' ? '#f87171' : '#fbbf24',
                      border: `1px solid ${room.status === 'VACANT' ? 'rgba(34,197,94,0.4)' : room.status === 'OCCUPIED' ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
                    }}>
                      {room.status === 'VACANT' ? '● Còn trống' : room.status === 'OCCUPIED' ? '● Đã thuê' : '● Bảo trì'}
                    </div>
                    {/* Room number overlay */}
                    <div style={{ position: 'absolute', bottom: 14, left: 18 }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-light-main)' }}>Phòng {room.roomNumber}</div>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a78bfa', letterSpacing: '-0.02em' }}>{formatCurrency(room.price)}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)', marginTop: 2 }}>mỗi tháng</div>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-light-muted)', fontSize: '0.88rem', lineHeight: 1.65, flexGrow: 1 }}>
                      {room.description || 'Phòng hiện đại, tiện nghi đầy đủ. Môi trường sống thoải mái và an toàn.'}
                    </p>
                    <button
                      onClick={() => handleSelectRoom(room.id)}
                      disabled={room.status !== 'VACANT'}
                      style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: room.status === 'VACANT' ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.92rem', transition: 'all 0.25s',
                        background: room.status === 'VACANT' ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'var(--bg-light-surface-alt)',
                        color: room.status === 'VACANT' ? 'white' : 'var(--text-light-muted)',
                        boxShadow: room.status === 'VACANT' ? '0 4px 20px rgba(124,58,237,0.35)' : 'none',
                      }}
                      onMouseEnter={e => { if (room.status === 'VACANT') e.currentTarget.style.boxShadow = '0 6px 28px rgba(124,58,237,0.55)'; }}
                      onMouseLeave={e => { if (room.status === 'VACANT') e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.35)'; }}
                    >
                      {room.status === 'VACANT' ? 'Đăng ký phòng này →' : 'Không khả dụng'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section style={{ padding: '120px 48px', background: 'var(--bg-light-base)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', right: -200, transform: 'translateY(-50%)', width: 600, height: 600, background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="section-label" style={{ display: 'inline-flex', marginBottom: 16 }}>💬 Khách hàng nói gì</div>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-light-main)', letterSpacing: '-0.03em', marginBottom: 16 }}>Được tin dùng bởi<br /><span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>hàng trăm cư dân</span></h2>
          </div>

          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card" style={{ padding: '30px', borderRadius: 20, background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${t.color}60, transparent)` }} />
                {/* Stars */}
                <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                  {[...Array(5)].map((_, si) => <span key={si} style={{ color: '#fbbf24', fontSize: '0.95rem' }}>★</span>)}
                </div>
                <p style={{ color: 'var(--text-light-muted)', fontSize: '0.92rem', lineHeight: 1.75, marginBottom: 24, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${t.color}30`, border: `2px solid ${t.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light-main)', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-light-main)', fontSize: '0.88rem' }}>{t.name}</div>
                    <div style={{ color: 'var(--text-light-muted)', fontSize: '0.75rem' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section style={{ padding: '100px 48px', background: 'var(--bg-light-surface)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(6,182,212,0.08) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '80%', height: 300, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-light-main)', letterSpacing: '-0.04em', marginBottom: 20, lineHeight: 1.1 }}>
            Sẵn sàng tìm<br />
            <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ngôi nhà mới?</span>
          </h2>
          <p style={{ color: 'var(--text-light-muted)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 40 }}>
            Đăng ký ngay hôm nay và chuyển vào phòng trong vòng 48 giờ. Quy trình nhanh gọn, minh bạch.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} className="btn-lp-primary" style={{ fontSize: '1.05rem', padding: '17px 42px' }}>
              Đăng ký ngay — Miễn phí
            </button>
            <Link href="/login" className="btn-lp-ghost" style={{ fontSize: '1.05rem', padding: '17px 36px' }}>
              Đăng nhập →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Form Section ────────────────────────────────────────────── */}
      <section id="contact" ref={formRef} style={{ padding: '120px 48px', background: 'var(--bg-light-base)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', left: -100, width: 500, height: 500, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-label" style={{ display: 'inline-flex', marginBottom: 16 }}>📋 Liên hệ</div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-light-main)', letterSpacing: '-0.03em', marginBottom: 12 }}>Đăng ký tư vấn</h2>
            <p style={{ color: 'var(--text-light-muted)', fontSize: '1rem' }}>Để lại thông tin, chúng tôi sẽ liên hệ trong vòng 15 phút</p>
          </div>

          <div style={{ padding: '48px', borderRadius: 24, background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', backdropFilter: 'blur(20px)' }}>
            {selectedRoomDetails && (
              <div style={{ marginBottom: 24, padding: '14px 18px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)', marginBottom: 2 }}>Đang quan tâm:</div>
                  <div style={{ color: '#a78bfa', fontWeight: 700 }}>Phòng {selectedRoomDetails.roomNumber} — {formatCurrency(selectedRoomDetails.price)}/tháng</div>
                </div>
                <button onClick={() => setFormData(prev => ({ ...prev, roomId: '' }))} style={{ color: 'var(--text-light-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', fontFamily: 'inherit' }}>Hủy chọn</button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Họ và tên *</label>
                  <input required name="name" type="text" value={formData.name} onChange={handleFormChange} className="lp-input" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Số điện thoại *</label>
                  <input required name="phone" type="tel" value={formData.phone} onChange={handleFormChange} className="lp-input" placeholder="0901 234 567" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email *</label>
                <input required name="email" type="email" value={formData.email} onChange={handleFormChange} className="lp-input" placeholder="email@example.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ghi chú (tùy chọn)</label>
                <textarea name="message" rows={3} value={formData.message} onChange={handleFormChange} className="lp-input" placeholder="Thời gian bạn có thể xem phòng, yêu cầu đặc biệt..." style={{ resize: 'vertical' }} />
              </div>

              <button type="submit" disabled={status === 'loading'} className="btn-lp-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '16px', marginTop: 4 }}>
                {status === 'loading' ? '⏳ Đang gửi...' : '✅ Gửi thông tin đăng ký'}
              </button>

              {status === 'success' && (
                <div style={{ padding: '14px 18px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, color: '#4ade80', fontWeight: 600, textAlign: 'center' }}>
                  🎉 Yêu cầu đã gửi! Chúng tôi sẽ gọi lại bạn sớm.
                </div>
              )}
              {status === 'error' && (
                <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#f87171', fontWeight: 600, textAlign: 'center' }}>
                  ❌ {errorMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--bg-light-surface)', borderTop: '1px solid var(--border-light)', padding: '60px 48px 40px' }}>
        <div className="footer-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
                </svg>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--text-light-main)', fontSize: '1.1rem' }}>SaaS<span style={{ color: '#a78bfa' }}> Rent</span></span>
            </div>
            <p style={{ color: 'var(--text-light-muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: 280 }}>
              Nền tảng quản lý nhà trọ thông minh, giúp chủ nhà và người thuê kết nối hiệu quả.
            </p>
          </div>

          {/* Links */}
          {[
            { title: 'Sản phẩm', links: [
              { label: 'Tính năng', href: '#features' }, 
              { label: 'Giá cả', href: '#' }, 
              { label: 'Phòng trống', href: '#rooms' }, 
              { label: 'API', href: '#' }
            ]},
            { title: 'Hỗ trợ', links: [
              { label: 'Câu hỏi thường gặp', href: '#' }, 
              { label: 'Liên hệ', href: '#contact' }, 
              { label: 'Điều khoản', href: '#' }, 
              { label: 'Bảo mật', href: '#' }
            ]},
            { title: 'Liên kết', links: [
              { label: 'Đăng nhập', href: '/login' }, 
              { label: 'Đăng ký thuê', href: '#contact' }, 
              { label: 'Tư vấn miễn phí', href: '#contact' }, 
              { label: 'Blog', href: '#' }
            ]},
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontWeight: 700, color: 'var(--text-light-main)', fontSize: '0.88rem', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(link => (
                  <Link key={link.label} href={link.href} style={{ color: 'var(--text-light-muted)', fontSize: '0.88rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as any).style.color = 'rgba(255,255,255,0.7)'}
                    onMouseLeave={e => (e.currentTarget as any).style.color = 'rgba(255,255,255,0.35)'}
                  >{link.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-light-muted)', fontSize: '0.82rem' }}>
          <span>© 2026 NestPro. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <span>Chính sách bảo mật</span>
            <span>Điều khoản sử dụng</span>
            <span style={{ color: 'var(--text-light-muted)' }}>Made with ♥ in Vietnam</span>
          </div>
        </div>
      </footer>

      {/* ── AI Chat Widget ────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {isChatOpen && (
          <div style={{ width: '360px', height: '500px', marginBottom: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🤖</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-light-main)' }}>RentBot AI</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                      Trực tuyến · Tư vấn thuê phòng
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} style={{ background: 'var(--bg-light-surface-alt)', border: 'none', color: 'var(--text-light-muted)', cursor: 'pointer', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>×</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                  {msg.role === 'ai' && <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>🤖</div>}
                  <div style={{ maxWidth: '78%', padding: '10px 13px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.06)', fontSize: '0.82rem', lineHeight: '1.6', color: 'var(--text-light-main)', border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.07)' : 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>🤖</div>
                  <div style={{ padding: '10px 14px', background: 'var(--bg-light-surface-alt)', borderRadius: '4px 16px 16px 16px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0, 1, 2].map(i => <span key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />)}
                    </div>
                    <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)} }`}</style>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {chatMessages.length <= 1 && (
              <div style={{ padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: '5px', borderTop: '1px solid var(--border-light)', flexShrink: 0 }}>
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} onClick={() => handleSendChat(q)} style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '0.7rem', cursor: 'pointer', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#c084fc', transition: 'all 0.2s', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{q}</button>
                ))}
              </div>
            )}

            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px', flexShrink: 0 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }} placeholder="Hỏi tôi bất kỳ điều gì..." disabled={isChatLoading} style={{ flex: 1, padding: '9px 13px', background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', borderRadius: '10px', color: 'var(--text-light-main)', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={() => handleSendChat()} disabled={isChatLoading || !chatInput.trim()} style={{ padding: '9px 13px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: '10px', color: 'var(--text-light-main)', cursor: 'pointer', fontSize: '0.9rem', opacity: (!chatInput.trim() || isChatLoading) ? 0.4 : 1, transition: 'opacity 0.2s' }}>➤</button>
            </div>
          </div>
        )}

        <button onClick={() => setIsChatOpen(prev => !prev)} style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isChatOpen ? '1.4rem' : '1.6rem', boxShadow: '0 8px 28px rgba(124,58,237,0.5)', transition: 'all 0.3s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(124,58,237,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,58,237,0.5)'; }}
        >
          {isChatOpen ? '✕' : '🤖'}
        </button>
      </div>
    </div>
  );
}
