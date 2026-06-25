'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../components/ui/use-toast';
import Chatbot from '../../components/Chatbot';
import { LogOut, Home, AlertCircle, FileText, CheckCircle2, Users, Zap, Droplets, CreditCard, Clock } from 'lucide-react';

export default function TenantDashboard() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<any>(null);
  
  // Landlord Bank Config
  const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID || 'MB';
  const ACCOUNT_NO = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0901234567';
  const ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'NGUYEN VAN A';
  
  // States for Req 2 & 3
  const [electricityKwh, setElectricityKwh] = useState<number>(0);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState('ELECTRICITY');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentError, setIncidentError] = useState('');

  const { on } = useSocket({ token: token || undefined, autoConnect: !!token });
  
  useEffect(() => {
    if (!token || !user) return;
    const unsubscribe = on(`notification-${user.id}`, (notification: any) => {
      if (notification.title === 'Cập nhật sự cố') {
        const fetchIncidentsOnly = async () => {
          const res = await fetch('http://localhost:3000/incidents', { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            setIncidents(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
          }
        };
        fetchIncidentsOnly();
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [on, token, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'TENANT') {
      router.push('/login');
      return;
    }

    if (user?.status === 'PENDING') {
      setLoading(false);
      return;
    }



  const fetchData = async () => {
      if (!token) return;
      try {
        const [invRes, conRes] = await Promise.all([
          fetch('http://localhost:3000/invoices', { cache: "no-store", headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:3000/contracts', { cache: "no-store", headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (invRes.ok) {
          const data = await invRes.json();
          setInvoices(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
        }
        if (conRes.ok) {
          const data = await conRes.json();
          setContracts(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
        }
      } catch (err) {
        toast({ title: 'Lỗi', description: 'Không thể tải dữ liệu' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token, router, authLoading]);

  // Nhắc nhở hạn nộp tiền
  useEffect(() => {
    if (invoices.length === 0) return;
    
    const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE');
    if (unpaidInvoices.length > 0) {
      let hasOverdue = false;
      let hasDueSoon = false;
      const today = new Date();
      today.setHours(0,0,0,0);
      
      unpaidInvoices.forEach(inv => {
        const dueDate = new Date(inv.dueDate);
        dueDate.setHours(0,0,0,0);
        
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) hasOverdue = true;
        if (diffDays === 0 || diffDays === 1) hasDueSoon = true;
      });

      if (hasOverdue) {
        toast({
          title: 'CẢNH BÁO: Hóa đơn quá hạn!',
          description: 'Bạn đang có hóa đơn quá hạn thanh toán. Vui lòng thanh toán ngay lập tức!',
          variant: 'destructive',
          duration: 10000,
        });
      } else if (hasDueSoon) {
        toast({
          title: 'Nhắc nhở thanh toán',
          description: 'Sắp đến hạn thanh toán tiền phòng (mùng 10). Vui lòng chuẩn bị thanh toán.',
          duration: 8000,
        });
      }
    }
  }, [invoices, toast]);

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/invoices/${invoiceId}/pay`, { method: 'POST', cache: "no-store", headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã gửi thông báo thanh toán cho chủ trọ.' });
        setInvoices(invoices.map(i => i.id === invoiceId ? { ...i, status: 'PAID' } : i));
        setPayingInvoice(null);
      } else {
        toast({ title: 'Lỗi', description: 'Không thể xử lý thanh toán', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể kết nối', variant: 'destructive' });
    }
  };


  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncidentError('');
    
    const roomId = currentContract?.roomId || currentContract?.room?.id;
    if (!roomId) {
      setIncidentError('Không tìm thấy thông tin phòng để báo cáo (Thiếu roomId).');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:3000/incidents', { method: 'POST', cache: "no-store", headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: incidentType, description: incidentDescription, roomId })
      });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã gửi báo cáo sự cố cho chủ trọ.' });
        setShowIncidentModal(false);
        setIncidentDescription('');
        
        // Refresh incidents
        const incRes = await fetch('http://localhost:3000/incidents', { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
        if (incRes.ok) {
          const data = await incRes.json();
          setIncidents(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
        }
      } else {
        const errorData = await res.json().catch(() => null);
        const errMsg = errorData?.message || 'Không thể gửi báo cáo (Lỗi Server).';
        setIncidentError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        toast({ title: 'Lỗi', description: 'Không thể gửi báo cáo', variant: 'destructive' });
      }
    } catch (err: any) {
      setIncidentError(err.message || 'Không thể kết nối đến máy chủ.');
      toast({ title: 'Lỗi', description: 'Không thể kết nối', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading || authLoading) return <div className="flex h-screen items-center justify-center bg-gray-50 ">Đang tải...</div>;

  if (user?.status === 'PENDING') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'transparent' }}>
        <div className="glass-panel p-10 text-center max-w-md w-full animate-fade-in" style={{ borderTop: '4px solid #eab308' }}>
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-main)' }}>Đang Chờ Phê Duyệt</h2>
          <p className="mb-8" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Tài khoản của bạn đã đăng ký thành công. Hệ thống đang chờ chủ trọ xác nhận hợp đồng. Vui lòng quay lại sau.</p>
          <button onClick={logout} className="btn-primary w-full py-3" style={{ fontSize: '1rem' }}>Đăng Xuất</button>
        </div>
      </div>
    );
  }

  const currentContract = contracts.length > 0 ? contracts[0] : null;
  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');

  
  return (
    <div className="min-h-screen font-sans pb-24" style={{ background: 'transparent', color: 'var(--text-main)' }}>
      {/* Navbar */}
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 font-extrabold text-2xl" style={{ color: 'white' }}>
            <Home strokeWidth={2.5} />
            <span>SaaS Rent</span>
          </div>
          <div className="flex items-center gap-4">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Khách Thuê</div>
              <div className="font-semibold">{user?.name}</div>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'var(--border-color)', margin: '0 8px' }}></div>
            <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Đăng xuất">
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Tổng Quan</h1>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {currentContract ? (
          <div className="grid gap-8 md:grid-cols-12">
            
            {/* Left Column (Bento Box 1 & 2) */}
            <div className="md:col-span-7 space-y-8">
              {/* Thông tin phòng & Hợp đồng */}
              <div className="glass-panel p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Home className="text-indigo-600" size={24} /> Hợp Đồng Của Tôi
                  </h2>
                  <span style={{ background: 'var(--status-success-bg)', color: 'var(--status-success-text)', padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '700' }}>Đang Có Hiệu Lực</span>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div style={{ background: 'var(--bg-surface)', backdropFilter: 'blur(24px)', padding: '20px', borderRadius: '16px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Số Phòng</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>{currentContract.room?.roomNumber || 'N/A'}</span>
                  </div>
                  <div style={{ background: 'var(--bg-surface)', backdropFilter: 'blur(24px)', padding: '20px', borderRadius: '16px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Giá Thuê/Tháng</span>
                    <span style={{ fontSize: '1.75rem', fontWeight: '700' }}>{Number(currentContract.rentalPrice).toLocaleString()} đ</span>
                  </div>
                </div>

                <div className="mt-6 space-y-4 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><Clock size={18}/> Thời gian thuê:</span>
                    <span className="font-semibold">{new Date(currentContract.startDate).toLocaleDateString('vi-VN')} - {new Date(currentContract.endDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><CreditCard size={18}/> Tiền cọc:</span>
                    <span className="font-semibold">{Number(currentContract.deposit || 0).toLocaleString()} đ</span>
                  </div>
                </div>
              </div>

              {/* Báo Cáo Sự Cố */}
              <div className="glass-panel p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <AlertCircle className="text-orange-500" size={24} /> Báo Cáo Sự Cố
                  </h2>
                  <button onClick={() => setShowIncidentModal(true)} className="btn-primary text-sm">
                    + Tạo Báo Cáo
                  </button>
                </div>
                
                {activeIncidents.length > 0 ? (
                  <div className="space-y-4">
                    {activeIncidents.map((i) => (
                      <div key={i.id} style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px' }}>
                        <div style={{ background: '#FED7AA', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AlertCircle size={24} className="text-orange-600" />
                        </div>
                        <div>
                          <div className="font-bold text-orange-900 text-lg mb-1">{i.title}</div>
                          <div className="text-orange-800 mb-2 whitespace-pre-wrap leading-relaxed">{i.description}</div>
                          <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                            {i.status === 'PENDING' ? '⏳ Đang chờ xử lý' : '🔧 Đang xử lý'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" style={{ color: 'white', background: 'var(--bg-surface)', backdropFilter: 'blur(24px)', borderRadius: '16px' }}>
                    <CheckCircle2 size={40} className="mx-auto mb-3 text-green-400" />
                    Không có sự cố nào đang mở. Mọi thứ hoạt động tốt!
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Invoices & Payment) */}
            <div className="md:col-span-5 space-y-8">
              <div className="glass-panel p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="text-indigo-600" size={24} /> Hóa Đơn
                  </h2>
                  <span className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">{invoices.filter(i => i.status === 'UNPAID').length} Chưa thanh toán</span>
                </div>

                {invoices.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }} className="text-center py-6">Chưa có hóa đơn nào.</p>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {invoices.map((inv) => (
                      <div key={inv.id} style={{ 
                        border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden',
                        background: inv.status === 'PAID' ? 'var(--bg-surface)' : 'transparent',
                        position: 'relative'
                      }}>
                        {inv.status !== 'PAID' && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'var(--status-error-text)' }}></div>}
                        
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-bold text-lg mb-1">{inv.invoiceNumber}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hạn: {new Date(inv.dueDate).toLocaleDateString('vi-VN')}</div>
                            </div>
                            <span style={{ 
                              padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700',
                              background: inv.status === 'PAID' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                              color: inv.status === 'PAID' ? 'var(--status-success-text)' : 'var(--status-error-text)'
                            }}>
                              {inv.status === 'PAID' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
                            </span>
                          </div>
                          
                          <div className="text-2xl font-extrabold mb-4" style={{ color: inv.status === 'PAID' ? 'var(--text-main)' : 'var(--primary)' }}>
                            {Number(inv.amount).toLocaleString()} đ
                          </div>

                          {inv.status !== 'PAID' ? (
                            <button onClick={() => setPayingInvoice(inv)} className="btn-primary w-full py-3" style={{ fontSize: '0.95rem' }}>
                              Thanh Toán Ngay
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 justify-center text-green-600 font-semibold py-2 bg-green-50 rounded-lg">
                              <CheckCircle2 size={18} /> Đã Hoàn Tất
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-8 text-center rounded-xl border border-dashed border-gray-300">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Bạn chưa có hợp đồng phòng nào đang hoạt động.</p>
            <p className="text-sm text-gray-400 mt-1">Vui lòng liên hệ chủ trọ để được cấp hợp đồng.</p>
          </div>
        )}
      </main>

      <Chatbot tenantContext={{
        tenantName: user?.name,
        contract: currentContract ? {
          roomNumber: currentContract.room?.roomNumber,
          startDate: currentContract.startDate,
          endDate: currentContract.endDate,
          rentalPrice: currentContract.rentalPrice,
          electricityPrice: currentContract.electricityPrice,
          waterPrice: currentContract.waterPrice,
          memberCount: currentContract.memberCount,
        } : null,
        invoices: invoices.map(i => ({ amount: i.amount, status: i.status, dueDate: i.dueDate })),
        incidents: incidents.map(i => ({ title: i.title, description: i.description, status: i.status })),

      }} />

      {/* Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel p-8 max-w-md w-full animate-fade-in relative">
            <button onClick={() => setPayingInvoice(null)} className="absolute top-4 right-4 text-gray-400 hover:">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center">Thanh Toán Hóa Đơn</h2>
            
            <div style={{ background: 'var(--bg-surface)', backdropFilter: 'blur(24px)', padding: '24px', borderRadius: '16px', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Số tiền cần thanh toán</div>
              <div className="text-4xl font-extrabold" style={{ color: 'white' }}>{Number(payingInvoice.amount).toLocaleString()} đ</div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngân hàng</span>
                <span className="font-bold">{BANK_ID}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số tài khoản</span>
                <span className="font-bold">{ACCOUNT_NO}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Chủ tài khoản</span>
                <span className="font-bold">{ACCOUNT_NAME}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nội dung CK</span>
                <span className="font-bold text-red-500 bg-red-50 px-2 rounded">{(user as any)?.phone} {payingInvoice.invoiceNumber}</span>
              </div>
            </div>
            
            <div className="text-center">
              <img 
                src={`https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-qr_only.png?amount=${payingInvoice.amount}&addInfo=${(user as any)?.phone}%20${payingInvoice.invoiceNumber}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`} 
                alt="QR Code" 
                className="mx-auto rounded-xl border p-2" style={{ borderColor: 'var(--border-color)', width: '200px', height: '200px' }}
              />
              <p className="text-sm mt-4 font-medium" style={{ color: 'var(--text-muted)' }}>Quét mã QR để thanh toán nhanh</p>
            </div>
            
            <button onClick={() => setPayingInvoice(null)} className="btn-primary w-full mt-6 py-3">Đóng</button>
            <button onClick={() => handlePayInvoice(payingInvoice.id)} className="btn-primary w-full mt-2 py-3">Đã chuyển khoản</button>
          </div>
        </div>
      )}

      {/* Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel p-8 max-w-md w-full animate-fade-in relative">
            <button onClick={() => setShowIncidentModal(false)} className="absolute top-4 right-4 text-gray-400 hover:">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><AlertCircle className="text-orange-500"/> Báo Cáo Sự Cố</h2>
            <form onSubmit={handleReportIncident} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Loại sự cố</label>
                <select className="w-full p-3 rounded-lg border focus:ring-2 outline-none" style={{ background: 'rgba(0,0,0,0.3)', color: 'white', borderColor: 'var(--border-color)' }} value={incidentType} onChange={e => setIncidentType(e.target.value)}>
                  <option value="ELECTRICITY">Điện (Mất điện, chập cháy...)</option>
                  <option value="WATER">Nước (Mất nước, rò rỉ...)</option>
                  <option value="FURNITURE">Nội thất (Hỏng giường, tủ...)</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Mô tả chi tiết</label>
                <textarea 
                  className="w-full p-3 rounded-lg border focus:ring-2 outline-none min-h-[100px]" 
                  style={{ background: 'transparent', borderColor: 'var(--border-color)' }}
                  placeholder="Mô tả sự cố bạn đang gặp phải..."
                  required
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                ></textarea>
              </div>
              {incidentError && <p className="text-red-500 text-sm">{incidentError}</p>}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowIncidentModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
