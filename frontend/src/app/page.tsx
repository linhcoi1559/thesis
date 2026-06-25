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
  const landlordId = 'e29d665b-efbe-40b3-bb66-df30bd5e8bf8'; // Mock Landlord ID
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    roomId: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const formRef = useRef<HTMLDivElement>(null);
  const roomsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // ── AI Chat Widget State ──────────────────────────────────────────
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Xin chào! 👋 Tôi là **RentBot**, trợ lý AI của Smart Boarding House.\n\nTôi có thể giúp bạn tìm phòng phù hợp, tư vấn giá cả và thời gian thuê tốt nhất. Bạn muốn hỏi gì?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const QUICK_QUESTIONS = [
    '🏠 Phòng nào còn trống?',
    '💰 Giá thuê bao nhiêu?',
    '🎓 Phòng nào cho sinh viên?',
    '📅 Nên thuê bao lâu?',
  ];

  const handleSendChat = async (text?: string) => {
    const message = text || chatInput.trim();
    if (!message || isChatLoading) return;
    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const res = await fetch('http://localhost:3000/ai/public-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: data.text || 'Xin lỗi, tôi không thể trả lời lúc này.' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: '⚠️ Lỗi kết nối. Vui lòng thử lại.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`http://localhost:3000/rooms/public`);
        if (response.ok) {
          const data = await response.json();
          setRooms(data);
        }
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);


  const handleSelectRoom = (roomId: string) => {
    setFormData(prev => ({ ...prev, roomId }));
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    toast({
      title: "Đã chọn phòng",
      description: "Vui lòng điền thông tin bên dưới để gửi yêu cầu thuê phòng.",
      duration: 3000,
    });
  };

  const handleExploreRooms = () => {
    roomsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:3000/rent-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message || undefined,
          landlordId,
          roomId: formData.roomId || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Đã xảy ra lỗi gửi yêu cầu');

      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '', roomId: '' });
      toast({ title: 'Thành công', description: 'Yêu cầu của bạn đã được gửi. Chúng tôi sẽ liên hệ sớm nhất!', duration: 5000 });
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Kết nối server thất bại');
      toast({ title: 'Lỗi', description: error.message || 'Lỗi hệ thống.', duration: 5000 });
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
  };

  const selectedRoomDetails = rooms.find(r => r.id === formData.roomId);

  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar */}
      <header className="glass-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 40px', transition: 'all 0.3s ease'
      }}>
        <div style={{ fontWeight: '800', fontSize: '1.5rem', letterSpacing: '-0.02em' }} className="text-gradient">
          SaaS Rent
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Hi, <strong style={{ color: 'white' }}>{user.name}</strong></span>
              {(user.role === 'ADMIN' || user.role === 'LANDLORD') && (
                <Link href="/admin" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.95rem' }}>
                  Dashboard
                </Link>
              )}
              {user.role === 'TENANT' && (
                <Link href="/tenant" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.95rem' }}>
                  Phòng Của Tôi
                </Link>
              )}
              <button onClick={logout} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                Đăng Xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem', padding: '10px' }}>Đăng Nhập</Link>
              <button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.95rem' }}>
                Đăng Ký Thuê
              </button>
            </>
          )}
        </div>
      </header>

      {/* 1. Hero Section */}
      <section style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        overflow: 'hidden'
      }}>
        {/* Abstract Glow Background */}
        <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', top: '-10%', left: '-10%', zIndex: -1 }}></div>
        <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', bottom: '-10%', right: '-10%', zIndex: -1 }}></div>
        
        {/* Background Image / Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/rooms/656430816_1617182629530479_8502833815304260238_n.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,
          zIndex: -2,
          mixBlendMode: 'luminosity'
        }} />

        <div style={{ textAlign: 'center', maxWidth: '800px', zIndex: 1, marginTop: '60px' }} className="animate-fade-in animate-float">
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 20px', 
            background: 'rgba(255,255,255,0.03)', 
            backdropFilter: 'blur(10px)',
            color: 'var(--text-main)',
            borderRadius: '999px',
            fontWeight: '500',
            fontSize: '0.875rem',
            marginBottom: '32px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e' }}></span>
            Hệ thống quản lý nhà trọ thông minh
          </div>
          
          <h1 style={{ fontSize: '5rem', fontWeight: '800', marginBottom: '24px', lineHeight: '1.05', letterSpacing: '-0.03em' }}>
            Trải nghiệm sống <br />
            <span className="text-gradient">Đẳng cấp & Tiện nghi</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '48px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 48px auto' }}>
            Nền tảng quản lý và thuê phòng trọ tự động hóa 100%. Môi trường sống an ninh, thủ tục nhanh gọn, hỗ trợ 24/7.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={handleExploreRooms} className="btn-primary" style={{ padding: '18px 40px', fontSize: '1.1rem', borderRadius: '14px' }}>
              Xem Phòng Trống
            </button>
            <button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} className="glass-panel" style={{ padding: '18px 40px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: '600', transition: 'all 0.3s' }}>
              Liên Hệ Tư Vấn
            </button>
          </div>
        </div>
      </section>

      {/* 2. Features Section */}
      <section style={{ padding: '80px 20px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {[
            { icon: '🔒', title: 'An Ninh 24/7', desc: 'Hệ thống camera giám sát an toàn tuyệt đối.' },
            { icon: '🔑', title: 'Giờ Giấc Tự Do', desc: 'Khóa vân tay cao cấp, ra vào thoải mái.' },
            { icon: '✨', title: 'Tiện Nghi Đầy Đủ', desc: 'Nội thất hiện đại, không gian thoáng mát.' },
            { icon: '🚀', title: 'Wifi Tốc Độ Cao', desc: 'Internet cáp quang ổn định, lướt web thả ga.' }
          ].map((feat, i) => (
            <div key={i} className="glass-panel" style={{ padding: '32px', textAlign: 'center', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{feat.icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>{feat.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Rooms Gallery Section */}
      <section ref={roomsRef} style={{ padding: '100px 20px', background: 'var(--bg-card)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '16px' }}>Phòng Đang Có Sẵn</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Tham quan các lựa chọn phù hợp nhất với nhu cầu của bạn</p>
          </div>

          {loadingRooms ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Đang tải danh sách phòng...</div>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              Hiện tại không có phòng nào trong hệ thống.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
              {rooms.map((room) => (
                <div key={room.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.3s ease', transform: 'translateY(0)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  {/* Image Container */}
                  <div style={{ height: '240px', position: 'relative', background: '#000' }}>
                    {room.imageUrls && room.imageUrls.length > 0 ? (
                      <img src={room.imageUrls[0]} alt={`Phòng ${room.roomNumber}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: room.status === 'VACANT' ? 1 : 0.6 }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chưa có ảnh</div>
                    )}
                    <span style={{ 
                      position: 'absolute', top: '16px', right: '16px', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700',
                      backgroundColor: room.status === 'VACANT' ? 'var(--status-success-bg)' : room.status === 'OCCUPIED' ? 'var(--status-error-bg)' : 'var(--status-pending-bg)',
                      color: room.status === 'VACANT' ? 'var(--status-success-text)' : room.status === 'OCCUPIED' ? 'var(--status-error-text)' : 'var(--status-pending-text)',
                      backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      {room.status === 'VACANT' ? 'Còn Trống' : room.status === 'OCCUPIED' ? 'Đã Thuê' : 'Bảo Trì'}
                    </span>
                  </div>

                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Phòng {room.roomNumber}</h3>
                    </div>
                    
                    <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '16px' }}>
                      {formatCurrency(room.price)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}>/tháng</span>
                    </div>
                    
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '32px', flexGrow: 1, lineHeight: '1.5' }}>
                      {room.description || 'Chưa có mô tả chi tiết.'}
                    </p>

                    <button 
                      onClick={() => handleSelectRoom(room.id)}
                      disabled={room.status !== 'VACANT'}
                      className="btn-primary"
                      style={{ padding: '14px', fontSize: '1rem', opacity: room.status !== 'VACANT' ? 0.5 : 1 }}
                    >
                      {room.status === 'VACANT' ? 'Đăng Ký Phòng Này' : 'Không Khả Dụng'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Contact/Registration Form Section */}
      <section ref={formRef} style={{ padding: '100px 20px', background: 'var(--bg-base)', position: 'relative' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="glass-panel" style={{ padding: '48px', borderRadius: '24px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px', textAlign: 'center' }}>
              Đăng Ký Tư Vấn
            </h2>
            
            {selectedRoomDetails ? (
              <div style={{ textAlign: 'center', marginBottom: '32px', padding: '16px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '4px' }}>Bạn đang quan tâm đến:</p>
                <p style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: '700' }}>
                  Phòng {selectedRoomDetails.roomNumber} - {formatCurrency(selectedRoomDetails.price)}
                </p>
                <button type="button" onClick={() => setFormData(prev => ({...prev, roomId: ''}))} style={{ color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.85rem', marginTop: '8px', cursor: 'pointer', background: 'none', border: 'none' }}>
                  Hủy chọn
                </button>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.05rem' }}>
                Để lại thông tin, chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
              </p>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.95rem' }}>Họ và tên</label>
                <input required name="name" type="text" value={formData.name} onChange={handleFormChange} className="form-input" style={{ padding: '14px' }} placeholder="Nguyễn Văn A" />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.95rem' }}>Số điện thoại</label>
                <input required name="phone" type="tel" value={formData.phone} onChange={handleFormChange} className="form-input" style={{ padding: '14px' }} placeholder="0901234567" />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.95rem' }}>Email</label>
                <input required name="email" type="email" value={formData.email} onChange={handleFormChange} className="form-input" style={{ padding: '14px' }} placeholder="email@example.com" />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.95rem' }}>Ghi chú thêm (Tùy chọn)</label>
                <textarea name="message" rows={4} value={formData.message} onChange={handleFormChange} className="form-input" style={{ padding: '14px', resize: 'vertical' }} placeholder="Thời gian bạn có thể xem phòng..." />
              </div>

              <button type="submit" disabled={status === 'loading'} className="btn-primary animate-pulse-glow" style={{ padding: '16px', fontSize: '1.1rem', marginTop: '10px' }}>
                {status === 'loading' ? 'Đang Xử Lý...' : 'Gửi Thông Tin Đăng Ký'}
              </button>

              {status === 'success' && (
                <div style={{ marginTop: '10px', padding: '16px', background: 'var(--status-success-bg)', color: 'var(--status-success-text)', borderRadius: '12px', textAlign: 'center', fontWeight: '500' }}>
                  🎉 Gửi yêu cầu thành công! Chúng tôi sẽ gọi lại cho bạn.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p>© 2026 Smart Boarding House. All rights reserved.</p>
      </footer>
      {/* AI Chat Widget */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        
        {/* Chat Panel */}
        {isChatOpen && (
          <div
            style={{
              width: '360px',
              height: '500px',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '20px',
              border: '1px solid rgba(168,85,247,0.4)',
              background: 'rgba(15,23,42,0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.1)',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            {/* Chat Header */}
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(59,130,246,0.3))', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>🤖</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white' }}>RentBot AI</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                      Trực tuyến • Tư vấn thuê phòng
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '1.1rem', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                  {msg.role === 'ai' && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>🤖</div>
                  )}
                  <div style={{
                    maxWidth: '78%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #a855f7, #3b82f6)' : 'rgba(255,255,255,0.07)',
                    fontSize: '0.82rem',
                    lineHeight: '1.6',
                    color: 'white',
                    border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🤖</div>
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px 16px 16px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0,1,2].map(i => <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7', display: 'inline-block', animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Questions - chỉ hiện lúc đầu */}
            {chatMessages.length <= 1 && (
              <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                {QUICK_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSendChat(q)}
                    style={{ padding: '5px 11px', borderRadius: '999px', fontSize: '0.72rem', cursor: 'pointer', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.12)'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '8px', flexShrink: 0 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Hỏi tôi bất kỳ điều gì..."
                disabled={isChatLoading}
                style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '0.82rem', outline: 'none' }}
              />
              <button
                onClick={() => handleSendChat()}
                disabled={isChatLoading || !chatInput.trim()}
                style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '1rem', opacity: (!chatInput.trim() || isChatLoading) ? 0.4 : 1, transition: 'opacity 0.2s' }}
              >
                ➤
              </button>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsChatOpen(prev => !prev)}
          style={{
            width: '58px', height: '58px', borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isChatOpen ? '1.5rem' : '1.75rem',
            boxShadow: '0 8px 30px rgba(168,85,247,0.5)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(168,85,247,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(168,85,247,0.5)'; }}
          title={isChatOpen ? 'Đóng chat' : 'Chat với RentBot AI'}
        >
          {isChatOpen ? '✕' : '🤖'}
        </button>
      </div>
    </div>
  );
}
