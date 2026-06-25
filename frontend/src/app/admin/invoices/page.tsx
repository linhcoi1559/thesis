'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '../../../components/ui/use-toast';
import { useAuth } from '../../../context/AuthContext';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  electricityCost: number;
  waterCost: number;
  otherCost: number;
  dueDate: string;
  status: string;
  contract: {
    id: string;
    contractNumber: string;
    room: { roomNumber: string };
    tenant: { name: string; phone: string };
  };
  createdAt: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  room: { roomNumber: string };
  tenant: { name: string };
  status: string;
  rentalPrice: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const { token } = useAuth();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Data
  const [selectedContractId, setSelectedContractId] = useState('');
  const [electricityCost, setElectricityCost] = useState('');
  const [waterCost, setWaterCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchInvoices = async () => {
    try {
      const res = await fetch('http://localhost:3000/invoices', { cache: "no-store", headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách hóa đơn' });
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await fetch('http://localhost:3000/contracts', { cache: "no-store", headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const contractList = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setContracts(contractList.filter((c: any) => c.status === 'ACTIVE'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return;
    Promise.all([fetchInvoices(), fetchContracts()]).finally(() => setIsLoading(false));
  }, [token, toast]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId || !dueDate) {
      toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const selectedContract = contracts.find(c => c.id === selectedContractId);
      if (!selectedContract) return;

      const baseAmount = Number(selectedContract.rentalPrice || 0);
      const eCost = Number(electricityCost || 0);
      const wCost = Number(waterCost || 0);
      const oCost = Number(otherCost || 0);
      const totalAmount = baseAmount + eCost + wCost + oCost;

      const res = await fetch('http://localhost:3000/invoices', { method: 'POST', cache: "no-store", headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          contractId: selectedContractId,
          amount: totalAmount,
          dueDate: new Date(dueDate).toISOString(),
          electricityCost: eCost,
          waterCost: wCost,
          otherCost: oCost
        })
      });
      
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã tạo hóa đơn mới' });
        setShowModal(false);
        // Reset form
        setSelectedContractId('');
        setElectricityCost('');
        setWaterCost('');
        setOtherCost('');
        setDueDate('');
        fetchInvoices();
      } else {
        const err = await res.json();
        toast({ title: 'Lỗi', description: err.message || 'Không thể tạo hóa đơn' });
      }
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Có lỗi xảy ra khi tạo hóa đơn' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:3000/invoices/${id}/status`, { method: 'PATCH', cache: "no-store", headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã cập nhật trạng thái hóa đơn' });
        setInvoices(prev => prev.map((inv: any) => inv.id === id ? { ...inv, status } : inv));
        fetchInvoices();
      }
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái' });
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>Quản lý Hóa Đơn</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Quản lý việc thu phí dịch vụ, tiền nhà và xuất hóa đơn cho khách.
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setShowModal(true)}
          style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: '600' }}
        >
          + Tạo Hóa Đơn
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải danh sách...</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có hóa đơn nào.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Mã HĐ</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Phòng & Khách</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Chi tiết phí</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Tổng cộng</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Hạn đóng</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Trạng thái</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => (
                  <tr 
                    key={inv.id} 
                    className="animate-slide-in"
                    style={{ 
                      borderBottom: idx !== invoices.length - 1 ? '1px solid var(--border-color)' : 'none',
                      transition: 'background 0.2s',
                      animationDelay: `${idx * 0.05}s`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px', fontWeight: '600', fontSize: '0.9rem' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{inv.contract?.room?.roomNumber || 'N/A'}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{inv.contract?.tenant?.name || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--text-normal)' }}>Điện: {Number(inv.electricityCost || 0).toLocaleString('vi-VN')} đ</div>
                      <div style={{ color: 'var(--text-normal)' }}>Nước: {Number(inv.waterCost || 0).toLocaleString('vi-VN')} đ</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 'bold', color: '#ef4444', fontSize: '1rem' }}>
                      {Number(inv.amount).toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>
                      {formatDate(inv.dueDate)}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {inv.status === 'PAID' ? (
                        <span style={{ padding: '4px 8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Đã thanh toán</span>
                      ) : inv.status === 'OVERDUE' ? (
                        <span style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Quá hạn</span>
                      ) : (
                        <span style={{ padding: '4px 8px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Chưa thanh toán</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      {inv.status !== 'PAID' && (
                        <button 
                          onClick={() => handleUpdateStatus(inv.id, 'PAID')}
                          style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'}
                        >
                          Đánh dấu Đã Thu
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '30px', margin: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Tạo Hóa Đơn Mới</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Chọn Hợp Đồng / Phòng <span style={{color: 'red'}}>*</span></label>
                <select 
                  className="form-input" 
                  value={selectedContractId} 
                  onChange={e => setSelectedContractId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn hợp đồng --</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>
                      Phòng {c.room?.roomNumber} - {c.tenant?.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedContractId && (
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  Tiền phòng cố định: <strong style={{color: 'var(--primary-color)'}}>{Number(contracts.find(c => c.id === selectedContractId)?.rentalPrice || 0).toLocaleString('vi-VN')} đ</strong>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tiền điện (VNĐ)</label>
                  <input type="number" min="0" className="form-input" value={electricityCost} onChange={e => setElectricityCost(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tiền nước (VNĐ)</label>
                  <input type="number" min="0" className="form-input" value={waterCost} onChange={e => setWaterCost(e.target.value)} placeholder="0" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Chi phí khác (Rác, mạng...)</label>
                <input type="number" min="0" className="form-input" value={otherCost} onChange={e => setOtherCost(e.target.value)} placeholder="0" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Hạn thanh toán <span style={{color: 'red'}}>*</span></label>
                <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
                  {isSubmitting ? 'Đang tạo...' : 'Tạo hóa đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
