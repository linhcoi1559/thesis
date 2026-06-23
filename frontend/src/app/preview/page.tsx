'use client';

import React, { useState, useEffect } from 'react';

// Interfaces for our interactive state
interface Room {
  id: string;
  roomNumber: string;
  price: number;
  floor: number;
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  amenities: string[];
  description: string;
}

interface RequestItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  roomNumber: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

interface Toast {
  id: string;
  title: string;
  description: string;
  visible: boolean;
}

export default function InteractivePreviewPage() {
  // Shared state simulation
  const [activeTab, setActiveTab] = useState<'split' | 'landing' | 'admin'>('split');
  
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', roomNumber: '101', price: 3200000, floor: 1, status: 'VACANT', amenities: ['Điều hòa', 'Tủ lạnh', 'Gác lửng'], description: 'Phòng khép kín sạch sẽ, ban công thoáng mát.' },
    { id: '2', roomNumber: '102', price: 3500000, floor: 1, status: 'VACANT', amenities: ['Điều hòa', 'Tủ lạnh', 'Máy giặt', 'Gác lửng'], description: 'Đầy đủ nội thất cao cấp, dọn vào ở ngay.' },
    { id: '3', roomNumber: '201', price: 3000000, floor: 2, status: 'VACANT', amenities: ['Điều hòa', 'Cửa sổ lớn'], description: 'Phòng thoáng mát giá cả hợp lý, giờ giấc tự do.' },
    { id: '4', roomNumber: '202', price: 3800000, floor: 2, status: 'VACANT', amenities: ['Điều hòa', 'Tủ lạnh', 'Máy giặt', 'Nóng lạnh', 'Ban công'], description: 'Phòng vip cao cấp, bảo mật vân tay.' },
  ]);

  const [requests, setRequests] = useState<RequestItem[]>([
    { id: 'req-1', name: 'Trần Minh Hoàng', phone: '0912345678', email: 'hoang.tran@gmail.com', roomNumber: '102', message: 'Tôi muốn hẹn xem phòng vào thứ 7 tuần này lúc 9h sáng.', status: 'PENDING', createdAt: new Date(Date.now() - 3600000 * 2) },
    { id: 'req-2', name: 'Nguyễn Thị Hương', phone: '0987654321', email: 'huong.nguyen@gmail.com', roomNumber: '101', message: 'Phòng này còn trống không ạ? Tôi muốn dọn vào ở ngay đầu tháng sau.', status: 'PENDING', createdAt: new Date(Date.now() - 1800000) },
  ]);

  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('');
  
  // Landing Form state
  const [formInput, setFormInput] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add toast helper
  const showToast = (title: string, description: string) => {
    const newToast: Toast = {
      id: Math.random().toString(),
      title,
      description,
      visible: true,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  // Toast auto-clear
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.map((t, idx) => (idx === 0 ? { ...t, visible: false } : t)));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // Handle select room from Landing Page grid
  const handleSelectRoom = (roomNum: string) => {
    setSelectedRoomNumber(roomNum);
    showToast('Chọn phòng thành công', `Bạn đã chọn phòng ${roomNum}. Hãy điền thông tin đăng ký tư vấn phía dưới.`);
  };

  // Handle Landing Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput.name || !formInput.phone || !formInput.email) {
      showToast('Lỗi nhập liệu', 'Vui lòng điền đầy đủ Họ tên, Số điện thoại và Email.');
      return;
    }

    const newRequest: RequestItem = {
      id: `req-${Math.random().toString(36).substr(2, 9)}`,
      name: formInput.name,
      phone: formInput.phone,
      email: formInput.email,
      roomNumber: selectedRoomNumber || 'Yêu cầu tư vấn chung',
      message: formInput.message || 'Không có lời nhắn',
      status: 'PENDING',
      createdAt: new Date(),
    };

    // Simulate sending real-time data to dashboard
    setRequests((prev) => [newRequest, ...prev]);
    setFormSubmitted(true);
    
    // Trigger floating notification simulating Socket.io event in dashboard
    showToast(
      '🔔 Yêu cầu tư vấn mới!',
      `Khách: ${formInput.name} vừa gửi đăng ký tư vấn cho Phòng: ${selectedRoomNumber || 'Chung'}`
    );

    // Reset form after 2 seconds
    setTimeout(() => {
      setFormInput({ name: '', phone: '', email: '', message: '' });
      setSelectedRoomNumber('');
      setFormSubmitted(false);
    }, 2500);
  };

  // Handle Action Buttons in Dashboard
  const handleApprove = (id: string, name: string, roomNum: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: 'APPROVED' } : req))
    );
    showToast('Đã phê duyệt', `Yêu cầu của ${name} cho phòng ${roomNum} đã được duyệt.`);
  };

  const handleReject = (id: string, name: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: 'REJECTED' } : req))
    );
    showToast('Đã từ chối', `Đã từ chối yêu cầu của ${name}.`);
  };

  const getPendingCount = () => requests.filter((r) => r.status === 'PENDING').length;
  const getApprovedCount = () => requests.filter((r) => r.status === 'APPROVED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased relative">
      
      {/* Toast Container (Floating Top-Right) */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.filter(t => t.visible).map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl shadow-xl backdrop-blur-md flex flex-col gap-1 transition-all duration-300 transform translate-x-0 animate-slide-in"
            style={{ animation: 'slideIn 0.3s ease-out forwards' }}
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-zinc-50 flex items-center gap-1.5">
              {toast.title}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              {toast.description}
            </div>
          </div>
        ))}
      </div>

      {/* Embedded slide-in animation styles */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-1rem) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Global Preview Header Control Panel */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></div>
          <span className="font-bold text-slate-900 text-sm tracking-wide uppercase">
            SaaS Interactive Sandbox Preview
          </span>
        </div>
        
        {/* Toggle Mode Button Switchers */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
          <button
            onClick={() => setActiveTab('split')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'split'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Xem Song Song (Split Screen)
          </button>
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'landing'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Trang Landing Page (Khách)
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Admin Dashboard (Chủ trọ)
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Mô phỏng Socket.io Local State Linkage
        </div>
      </header>

      {/* Workspace Display Grid */}
      <main className="p-6 max-w-[1700px] mx-auto">
        <div className={`grid gap-6 ${activeTab === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>

          {/* VIEW 1: LANDING PAGE (Public View) */}
          {(activeTab === 'split' || activeTab === 'landing') && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col min-h-[820px]">
              
              {/* Landing Page Navbar */}
              <div className="border-b border-slate-100 bg-white/50 px-6 py-4 flex items-center justify-between">
                <div className="font-extrabold text-indigo-600 tracking-tight flex items-center gap-1.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <span>HOMESTEAD SAAS</span>
                </div>
                <div className="flex gap-4 text-xs font-semibold text-slate-500">
                  <span className="hover:text-indigo-600 cursor-pointer">Trang chủ</span>
                  <span className="hover:text-indigo-600 cursor-pointer">Phòng trống</span>
                  <span className="hover:text-indigo-600 cursor-pointer">Giá cả</span>
                  <span className="hover:text-indigo-600 cursor-pointer">Liên hệ</span>
                </div>
              </div>

              {/* Hero Banner Component */}
              <div className="px-8 py-10 bg-gradient-to-br from-indigo-50/60 via-slate-50 to-white text-center border-b border-slate-100">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 mb-4 tracking-wide uppercase">
                  Nhà trọ thông minh 4.0
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight max-w-md mx-auto leading-tight">
                  Tìm Phòng Trọ Thông Minh & Trực Quan Hơn
                </h1>
                <p className="mt-3 text-sm text-slate-500 max-w-sm mx-auto">
                  Đặt chỗ xem phòng, thanh toán dịch vụ online, gửi phản hồi sự cố tức thì chỉ với vài chạm.
                </p>
                <div className="mt-6">
                  <a
                    href="#rooms-section"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all"
                  >
                    Xem phòng trống
                  </a>
                </div>
              </div>

              {/* Available Rooms Grid */}
              <div id="rooms-section" className="p-8 flex-1">
                <div className="mb-6 flex justify-between items-end">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Danh sách phòng trống</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Vui lòng chọn phòng để điền form tư vấn bên dưới</p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    Còn {rooms.length} phòng trống
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`border p-5 rounded-2xl transition-all relative ${
                        selectedRoomNumber === room.roomNumber
                          ? 'border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/10 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tầng {room.floor}</span>
                          <h4 className="text-base font-extrabold text-slate-950 mt-0.5">Phòng {room.roomNumber}</h4>
                        </div>
                        <span className="text-sm font-extrabold text-indigo-600">
                          {room.price.toLocaleString('vi-VN')} đ<span className="text-[10px] font-normal text-slate-400">/tháng</span>
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                        {room.description}
                      </p>

                      {/* Amenities Badges */}
                      <div className="flex flex-wrap gap-1 mb-5">
                        {room.amenities.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/50"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleSelectRoom(room.roomNumber)}
                        className={`w-full py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                          selectedRoomNumber === room.roomNumber
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {selectedRoomNumber === room.roomNumber ? 'Đang chọn' : 'Chọn phòng'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Consultation Form Component */}
                <div className="mt-8 border-t border-slate-100 pt-8 max-w-lg mx-auto">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Đăng ký tư vấn thuê phòng</h3>
                    <p className="text-xs text-slate-400 mt-1">Thông tin đăng ký của bạn sẽ được gửi tức thì đến Dashboard của chủ nhà</p>
                  </div>

                  <form className="space-y-4" onSubmit={handleFormSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Họ tên *</label>
                        <input
                          type="text"
                          required
                          value={formInput.name}
                          onChange={(e) => setFormInput(p => ({ ...p, name: e.target.value }))}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Số điện thoại *</label>
                        <input
                          type="tel"
                          required
                          value={formInput.phone}
                          onChange={(e) => setFormInput(p => ({ ...p, phone: e.target.value }))}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                          placeholder="0912345678"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          value={formInput.email}
                          onChange={(e) => setFormInput(p => ({ ...p, email: e.target.value }))}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Phòng đã chọn</label>
                        <input
                          type="text"
                          disabled
                          value={selectedRoomNumber ? `Phòng ${selectedRoomNumber}` : 'Chưa chọn phòng'}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Lời nhắn tư vấn</label>
                      <textarea
                        rows={3}
                        value={formInput.message}
                        onChange={(e) => setFormInput(p => ({ ...p, message: e.target.value }))}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                        placeholder="Ví dụ: Tôi muốn dọn vào ở từ ngày 1 hàng tháng..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={formSubmitted}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all disabled:bg-slate-350 cursor-pointer"
                    >
                      {formSubmitted ? '✔ Đã gửi thông tin!' : 'Gửi thông tin đăng ký'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: ADMIN DASHBOARD (Private View) */}
          {(activeTab === 'split' || activeTab === 'admin') && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col min-h-[820px] text-zinc-300">
              
              {/* Private Dashboard Header */}
              <header className="h-16 border-b border-slate-800/80 bg-slate-950 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-xs tracking-wider">
                    SB
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">CHỦ TRỌ PORTAL</span>
                    <span className="text-[10px] text-zinc-500">Boarding House SaaS</span>
                  </div>
                </div>

                {/* Simulated Socket Status Connection */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-900/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Kết nối Real-time (Active)
                  </span>
                  <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-xs border border-zinc-700">
                    AD
                  </div>
                </div>
              </header>

              <div className="flex flex-1">
                {/* Admin Sidebar Layout */}
                <aside className="w-56 border-r border-slate-800/60 bg-slate-950/60 p-4 hidden sm:block flex-shrink-0">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-indigo-950/60 text-indigo-400 font-bold text-xs border border-indigo-900/40">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                      Dashboard
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 hover:text-white transition-all font-medium text-xs text-zinc-500 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21h8.25" /></svg>
                      Quản lý phòng
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 hover:text-white transition-all font-medium text-xs text-zinc-500 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                      Hợp đồng trọ
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 hover:text-white transition-all font-medium text-xs text-zinc-500 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                      Hóa đơn tháng
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 hover:text-white transition-all font-medium text-xs text-zinc-500 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.68-.69-1.25-2.08-1.25-3.84s.57-3.15 1.25-3.84m4.32 0c.69.69 1.25 2.08 1.25 3.84s-.56 3.15-1.25 3.84m-8.15-3.84a8.25 8.25 0 0113.8-.6m-13.8.6a8.25 8.25 0 0013.8.6" /></svg>
                      Nhật ký hệ thống
                    </div>
                  </div>
                </aside>

                {/* Dashboard Main Workspace Area */}
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-x-hidden">
                  
                  {/* High Fidelity Stats Counter Row */}
                  <div className="grid grid-cols-3 gap-4">
                    
                    {/* Stat item 1 */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Tổng số phòng</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-xl font-extrabold text-white">24</span>
                        <span className="text-[10px] text-zinc-400">phòng</span>
                      </div>
                    </div>

                    {/* Stat item 2 */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Phòng trống</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-xl font-extrabold text-emerald-400">5</span>
                        <span className="text-[10px] text-zinc-400">còn trống</span>
                      </div>
                    </div>

                    {/* Stat item 3 */}
                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-950/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-full blur-xl"></div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                        Chờ phê duyệt
                      </span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-xl font-extrabold text-indigo-400 transition-all duration-300 transform scale-110">
                          {getPendingCount()}
                        </span>
                        <span className="text-[10px] text-indigo-500 font-medium">yêu cầu</span>
                      </div>
                    </div>

                  </div>

                  {/* PREMIUM REAL-TIME REQUESTS TABLE CONTAINER */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl shadow-xl flex flex-col flex-1 overflow-hidden">
                    
                    {/* Table Header Details */}
                    <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          Danh sách yêu cầu tư vấn phòng
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Real-time
                          </span>
                        </h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Yêu cầu tư vấn tự động cập nhật từ Landing Page khi có submit.</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <span className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md font-semibold text-zinc-400">
                          Đã duyệt: {getApprovedCount()}
                        </span>
                      </div>
                    </div>

                    {/* Premium Table Element with Soft Borders */}
                    <div className="overflow-x-auto flex-1">
                      <table className="min-w-full divide-y divide-slate-800/60 text-xs">
                        <thead className="bg-slate-950/20">
                          <tr className="border-b border-slate-800/80 text-zinc-400 font-semibold">
                            <th scope="col" className="px-5 py-3 text-left tracking-wide">Khách hàng</th>
                            <th scope="col" className="px-5 py-3 text-left tracking-wide">Điện thoại / Email</th>
                            <th scope="col" className="px-5 py-3 text-left tracking-wide">Phòng chọn</th>
                            <th scope="col" className="px-5 py-3 text-left tracking-wide">Thời gian</th>
                            <th scope="col" className="px-5 py-3 text-left tracking-wide">Trạng thái</th>
                            <th scope="col" className="px-5 py-3 text-center tracking-wide">Thao tác</th>
                          </tr>
                        </thead>
                        
                        <tbody className="divide-y divide-slate-800/40 bg-slate-950/10">
                          {requests.map((req, idx) => (
                            <tr
                              key={req.id}
                              className={`transition-all duration-300 hover:bg-slate-900/40 border-b border-slate-800/30 ${
                                idx === 0 && req.status === 'PENDING' ? 'bg-indigo-950/10 animate-fade-in' : ''
                              }`}
                            >
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <div className="font-bold text-white">{req.name}</div>
                                <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1 max-w-[150px] italic">
                                  "{req.message}"
                                </div>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <div className="text-zinc-200">{req.phone}</div>
                                <div className="text-[10px] text-zinc-500">{req.email}</div>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  Phòng {req.roomNumber}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-zinc-400 text-[10px]">
                                {req.createdAt.toLocaleTimeString('vi-VN')} ({new Date(req.createdAt).toLocaleDateString('vi-VN')})
                              </td>
                              
                              {/* PREMIUM CUSTOM STATUS BADGES REDESIGNED */}
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                {req.status === 'PENDING' && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                    Chờ duyệt
                                  </span>
                                )}
                                {req.status === 'APPROVED' && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                    Đã duyệt
                                  </span>
                                )}
                                {req.status === 'REJECTED' && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                                    Từ chối
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-3.5 whitespace-nowrap text-center">
                                {req.status === 'PENDING' ? (
                                  <div className="inline-flex gap-1.5">
                                    <button
                                      onClick={() => handleApprove(req.id, req.name, req.roomNumber)}
                                      className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer"
                                    >
                                      Duyệt
                                    </button>
                                    <button
                                      onClick={() => handleReject(req.id, req.name)}
                                      className="px-2.5 py-1 rounded-md text-[10px] font-bold text-zinc-400 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
                                    >
                                      Từ chối
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-zinc-600 italic">Đã xử lý</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
