'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
    rentalPrice: number;
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

function getDaysUntil(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { toast } = useToast();
  const { token } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [electricityCost, setElectricityCost] = useState('');
  const [waterCost, setWaterCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/invoices`, { cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setInvoices(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch { toast({ title: 'Lỗi', description: 'Không thể tải danh sách hóa đơn' }); }
  };

  const fetchContracts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/contracts`, { cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setContracts(list.filter((c: any) => c.status === 'ACTIVE'));
      }
    } catch { console.error('Cannot fetch contracts'); }
  };

  useEffect(() => {
    if (!token) return;
    Promise.all([fetchInvoices(), fetchContracts()]).finally(() => setIsLoading(false));
  }, [token]);

  const stats = useMemo(() => {
    const paid = invoices.filter(i => i.status === 'PAID');
    const unpaid = invoices.filter(i => i.status === 'UNPAID');
    const overdue = invoices.filter(i => i.status === 'OVERDUE');
    const totalRevenue = paid.reduce((sum, i) => sum + i.amount, 0);
    const pendingAmount = unpaid.concat(overdue).reduce((sum, i) => sum + i.amount, 0);
    return { total: invoices.length, paid: paid.length, unpaid: unpaid.length, overdue: overdue.length, totalRevenue, pendingAmount };
  }, [invoices]);

  const filtered = useMemo(() => invoices.filter(i => {
    const matchSearch = !searchQuery ||
      i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.contract?.room?.roomNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.contract?.tenant?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || i.status === filterStatus;
    return matchSearch && matchStatus;
  }), [invoices, searchQuery, filterStatus]);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/invoices`, {
        method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ contractId: selectedContractId, amount: totalAmount, dueDate: new Date(dueDate).toISOString(), electricityCost: eCost, waterCost: wCost, otherCost: oCost })
      });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã tạo hóa đơn mới' });
        setShowModal(false);
        setSelectedContractId(''); setElectricityCost(''); setWaterCost(''); setOtherCost(''); setDueDate('');
        fetchInvoices();
      } else {
        const err = await res.json();
        toast({ title: 'Lỗi', description: err.message || 'Không thể tạo hóa đơn' });
      }
    } catch { toast({ title: 'Lỗi', description: 'Có lỗi xảy ra khi tạo hóa đơn' }); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/invoices/${id}/status`, {
        method: 'PATCH', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã cập nhật trạng thái hóa đơn' });
        setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
      }
    } catch { toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái' }); }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN');
  const formatCurrency = (n: number) => Number(n).toLocaleString('vi-VN') + ' đ';

  const getStatusBadge = (status: string) => {
    if (status === 'PAID') return <span className="badge badge-success"><span className="badge-dot" />Đã thanh toán</span>;
    if (status === 'OVERDUE') return <span className="badge badge-danger"><span className="badge-dot" />Quá hạn</span>;
    return <span className="badge badge-warning"><span className="badge-dot" />Chưa thanh toán</span>;
  };

  const selectedContract = contracts.find(c => c.id === selectedContractId);
  const baseAmount = selectedContract ? Number(selectedContract.rentalPrice || 0) : 0;
  const totalPreview = baseAmount + Number(electricityCost || 0) + Number(waterCost || 0) + Number(otherCost || 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hóa đơn</h1>
          <p className="page-subtitle">Quản lý thu phí dịch vụ, tiền nhà và xuất hóa đơn cho khách</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '10px 20px', borderRadius: 12, fontSize: '0.9rem' }}>
          + Tạo hóa đơn
        </button>
      </div>

      {/* Financial Stat Cards */}
      <div className="stat-grid">
        {[
          { label: 'Đã thu', value: formatCurrency(stats.totalRevenue), subtext: `${stats.paid} hóa đơn`, color: 'green', icon: '✅' },
          { label: 'Chờ thanh toán', value: formatCurrency(stats.pendingAmount), subtext: `${stats.unpaid} hóa đơn`, color: 'yellow', icon: '⏳' },
          { label: 'Tổng hóa đơn', value: String(stats.total), subtext: 'tất cả trạng thái', color: 'indigo', icon: '📋' },
        ].map((card, i) => (
          <div key={i} className={`stat-card ${card.color} animate-fade-in`} style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-card-label">{card.label}</span>
              <div className={`stat-card-icon ${card.color}`}>{card.icon}</div>
            </div>
            <div className="stat-card-value" style={{ fontSize: typeof card.value === 'string' && card.value.length > 10 ? '1.3rem' : '2rem' }}>{card.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)' }}>{card.subtext}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: '1 1 260px', minWidth: 220 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: 'var(--text-light-muted)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input placeholder="Tìm mã HD, phòng, tên khách..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ color: 'var(--text-light-muted)', fontSize: 18, lineHeight: 1 }}>×</button>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PAID', label: '✅ Đã thu' },
            { key: 'UNPAID', label: '⏳ Chưa thu' },
            { key: 'OVERDUE', label: '🚨 Quá hạn' },
          ].map(s => (
            <button key={s.key} onClick={() => setFilterStatus(s.key)} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
              border: '1px solid', borderColor: filterStatus === s.key ? 'var(--primary)' : 'var(--border-light)',
              background: filterStatus === s.key ? 'rgba(79,70,229,0.08)' : 'white',
              color: filterStatus === s.key ? 'var(--primary)' : 'var(--text-light-muted)',
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
            }}>{s.label}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-light-muted)', fontWeight: 500 }}>{filtered.length} hóa đơn</div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border-light)', boxShadow: 'var(--neo-shadow)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(79,70,229,0.15)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: 'var(--text-light-muted)', fontSize: '0.9rem' }}>Đang tải...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-title">{invoices.length === 0 ? 'Chưa có hóa đơn nào' : 'Không tìm thấy kết quả'}</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã hóa đơn</th>
                  <th>Phòng & Khách</th>
                  <th>Chi phí</th>
                  <th>Tổng cộng</th>
                  <th>Hạn đóng</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, idx) => {
                  const daysLeft = getDaysUntil(inv.dueDate);
                  const isOverdue = inv.status === 'OVERDUE';
                  const rowHighlight = isOverdue ? 'rgba(239,68,68,0.03)' : '';
                  return (
                    <tr key={inv.id} className="animate-slide-in" style={{ animationDelay: `${idx * 0.04}s`, background: rowHighlight }}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', background: 'rgba(79,70,229,0.06)', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>{inv.invoiceNumber}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-light-main)' }}>
                          <span style={{ background: 'rgba(79,70,229,0.07)', padding: '2px 8px', borderRadius: 6, color: 'var(--primary)', fontSize: '0.9rem' }}>P.{inv.contract?.room?.roomNumber || 'N/A'}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginTop: 3 }}>{inv.contract?.tenant?.name || 'N/A'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {inv.electricityCost > 0 && <span style={{ fontSize: '0.72rem', padding: '2px 7px', background: 'rgba(245,158,11,0.1)', color: '#d97706', borderRadius: 999, border: '1px solid rgba(245,158,11,0.2)', fontWeight: 600 }}>⚡ {Number(inv.electricityCost).toLocaleString('vi-VN')}đ</span>}
                          {inv.waterCost > 0 && <span style={{ fontSize: '0.72rem', padding: '2px 7px', background: 'rgba(59,130,246,0.1)', color: '#2563eb', borderRadius: 999, border: '1px solid rgba(59,130,246,0.2)', fontWeight: 600 }}>💧 {Number(inv.waterCost).toLocaleString('vi-VN')}đ</span>}
                          {inv.otherCost > 0 && <span style={{ fontSize: '0.72rem', padding: '2px 7px', background: 'rgba(100,116,139,0.1)', color: '#475569', borderRadius: 999, border: '1px solid rgba(100,116,139,0.2)', fontWeight: 600 }}>+ {Number(inv.otherCost).toLocaleString('vi-VN')}đ</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: isOverdue ? '#dc2626' : 'var(--text-light-main)' }}>{formatCurrency(inv.amount)}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light-main)' }}>{formatDate(inv.dueDate)}</div>
                        {inv.status !== 'PAID' && (
                          <div style={{ fontSize: '0.72rem', marginTop: 2, fontWeight: 600, color: daysLeft < 0 ? '#dc2626' : daysLeft <= 3 ? '#d97706' : 'var(--text-light-muted)' }}>
                            {daysLeft < 0 ? `Trễ ${Math.abs(daysLeft)} ngày` : daysLeft === 0 ? 'Hôm nay!' : `Còn ${daysLeft} ngày`}
                          </div>
                        )}
                      </td>
                      <td>{getStatusBadge(inv.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {inv.status !== 'PAID' && (
                            <button onClick={() => handleUpdateStatus(inv.id, 'PAID')} className="btn-icon btn-icon-green">
                              ✅ Đánh dấu đã thu
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-panel-light" style={{ maxWidth: 520 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-light-main)' }}>Tạo hóa đơn mới</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginTop: 2 }}>Nhập thông tin chi phí cho kỳ này</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-light-muted)' }}>×</button>
            </div>
            <form onSubmit={handleCreateInvoice} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Chọn hợp đồng / Phòng <span style={{ color: '#dc2626' }}>*</span></label>
                <select className="form-input" value={selectedContractId} onChange={e => setSelectedContractId(e.target.value)} required>
                  <option value="">-- Chọn hợp đồng --</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>Phòng {c.room?.roomNumber} - {c.tenant?.name}</option>
                  ))}
                </select>
              </div>

              {selectedContractId && (
                <div style={{ padding: '12px 14px', background: 'rgba(79,70,229,0.06)', borderRadius: 10, border: '1px solid rgba(79,70,229,0.15)', fontSize: '0.85rem' }}>
                  💰 Tiền phòng cố định: <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{formatCurrency(baseAmount)}</strong>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="form-label">⚡ Tiền điện (VNĐ)</label>
                  <input type="number" min="0" className="form-input" value={electricityCost} onChange={e => setElectricityCost(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="form-label">💧 Tiền nước (VNĐ)</label>
                  <input type="number" min="0" className="form-input" value={waterCost} onChange={e => setWaterCost(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="form-label">Chi phí khác (Rác, mạng...)</label>
                <input type="number" min="0" className="form-input" value={otherCost} onChange={e => setOtherCost(e.target.value)} placeholder="0" />
              </div>

              {selectedContractId && (
                <div style={{ padding: '14px 16px', background: 'var(--bg-light-surface-alt)', borderRadius: 12, border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-light-muted)', fontWeight: 600 }}>Tổng cộng</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(totalPreview)}</span>
                </div>
              )}

              <div>
                <label className="form-label">Hạn thanh toán <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-light" style={{ flex: 1, padding: 11, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Hủy</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, padding: 11, borderRadius: 10 }}>
                  {isSubmitting ? '⏳ Đang tạo...' : '✅ Tạo hóa đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
