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

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`http://localhost:3000/rooms?landlordId=${landlordId}`);
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
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px', background: 'transparent'
      }}>
        <div style={{ fontWeight: '800', fontSize: '1.25rem', color: 'white' }}>
          Smart Boarding House
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ color: 'white', opacity: 0.8 }}>Xin chào, {user.name}</span>
              {(user.role === 'ADMIN' || user.role === 'LANDLORD') && (
                <Link href="/admin" className="glass-panel" style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none' }}>
                  Vào Dashboard
                </Link>
              )}
              <button onClick={logout} style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', cursor: 'pointer' }}>
                Đăng Xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>Đăng Nhập</Link>
              <Link href="/register" className="btn-primary" style={{ padding: '8px 16px', textDecoration: 'none' }}>Đăng Ký</Link>
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
        {/* Background Image / Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/rooms/656430816_1617182629530479_8502833815304260238_n.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
          zIndex: -2
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(15,23,42,0.8) 0%, rgba(15,23,42,1) 100%)',
          zIndex: -1
        }} />

        <div style={{ textAlign: 'center', maxWidth: '800px', zIndex: 1 }} className="animate-fade-in animate-float">
          <span style={{ 
            display: 'inline-block', 
            padding: '8px 16px', 
            background: 'rgba(168, 85, 247, 0.1)', 
            color: '#c084fc',
            borderRadius: '999px',
            fontWeight: '600',
            fontSize: '0.875rem',
            marginBottom: '24px',
            border: '1px solid rgba(168, 85, 247, 0.2)'
          }}>
            🌟 Hệ thống quản lý nhà trọ số 1
          </span>
          <h1 style={{ fontSize: '4.5rem', fontWeight: '800', marginBottom: '24px', lineHeight: '1.1' }}>
            Trải nghiệm sống <br />
            <span className="text-gradient">Đẳng cấp & Tiện nghi</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: '1.6' }}>
            Môi trường sống an ninh, sạch sẽ và hiện đại. Khám phá ngay các phòng đang còn trống và đặt chỗ chỉ với vài thao tác đơn giản.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={handleExploreRooms} className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              Khám Phá Phòng Ngay
            </button>
            <button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} className="glass-panel" style={{ padding: '16px 32px', fontSize: '1.1rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}>
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
    </div>
  );
}
