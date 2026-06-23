'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Home, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';

export default function TenantDashboard() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'TENANT') {
      router.push('/login');
      return;
    }

    const fetchInvoices = async () => {
      try {
        const res = await fetch('http://localhost:3000/invoices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setInvoices(data.data);
        }
      } catch (err) {
        toast({ title: 'Lỗi', description: 'Không thể tải hóa đơn' });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user, token, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-800">Đang tải...</div>;

  const currentContract = invoices.length > 0 ? invoices[0].contract : null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <Home />
            <span>SaaS Rent - Tenant</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium">Xin chào, {user?.name}</span>
            <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Contract Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Thông tin phòng thuê</h2>
            {currentContract ? (
              <p className="text-gray-500">Phòng: <span className="font-bold text-indigo-600">{currentContract.room.roomNumber}</span></p>
            ) : (
              <p className="text-gray-500">Bạn chưa có hợp đồng phòng nào.</p>
            )}
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <CheckCircle2 size={18} />
            Trạng thái: Đang Thuê
          </div>
        </div>

        {/* Invoices List */}
        <h3 className="text-xl font-bold flex items-center gap-2 mt-8 mb-4">
          <FileText className="text-indigo-600" />
          Hóa đơn của bạn
        </h3>

        {invoices.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-dashed border-gray-300 text-gray-500">
            Chưa có hóa đơn nào.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {invoices.map((inv) => {
              const isUnpaid = inv.status === 'UNPAID';
              // Generate VietQR URL
              const l = inv.landlord;
              let qrUrl = null;
              if (isUnpaid && l?.bankName && l?.bankAccountNumber) {
                const addInfo = encodeURIComponent(`Thanh toan hoa don ${inv.invoiceNumber}`);
                const accName = l.bankAccountName ? `&accountName=${encodeURIComponent(l.bankAccountName)}` : '';
                qrUrl = `https://img.vietqr.io/image/${l.bankName}-${l.bankAccountNumber}-compact2.jpg?amount=${inv.amount}&addInfo=${addInfo}${accName}`;
              }

              return (
                <div key={inv.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col ${isUnpaid ? 'border-indigo-200 ring-1 ring-indigo-500/20' : 'border-gray-100'}`}>
                  {/* Header Card */}
                  <div className={`p-4 border-b flex justify-between items-center ${isUnpaid ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mã hóa đơn</p>
                      <p className="font-bold font-mono text-gray-900">{inv.invoiceNumber}</p>
                    </div>
                    {isUnpaid ? (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><AlertCircle size={14}/> Chưa thanh toán</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Đã thanh toán</span>
                    )}
                  </div>

                  {/* Body Card */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Số tiền:</span>
                        <span className="font-bold text-lg text-gray-900">{Number(inv.amount).toLocaleString('vi-VN')} VND</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hạn chót:</span>
                        <span className="font-medium text-gray-700">{new Date(inv.dueDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    {qrUrl && (
                      <div className="mt-4 border-t pt-4">
                        <p className="text-sm font-medium text-center mb-3 text-indigo-600">Quét mã QR để thanh toán tự động</p>
                        <div className="flex justify-center bg-gray-50 rounded-xl p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={qrUrl} alt="VietQR" className="w-48 h-48 rounded-lg shadow-sm" />
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-3">Mở App Ngân hàng hoặc Momo để quét mã</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
