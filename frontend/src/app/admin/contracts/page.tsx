'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../components/ui/use-toast';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../hooks/useSocket';

interface Contract {
  id: string;
  contractNumber: string;
  tenantId: string;
  roomId: string;
  startDate: string;
  endDate: string;
  rentalPrice: number;
  deposit: number;
  electricityPrice: number;
  waterPrice: number;
  status: string;
  room: { roomNumber: string };
  tenant: { id: string; name: string; email: string; phone: string };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string;
  contractId: string;
}

interface Incident {
  id: string;
  title: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  tenantId: string;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#3b82f6,#60a5fa)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f43f5e,#fb7185)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#06b6d4,#22d3ee)',
];
function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
}

function getDaysLeft(endDate: string) {
  const today = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { toast } = useToast();
  const { token, user } = useAuth();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'invoices' | 'incidents'>('info');
  const [tenantInvoices, setTenantInvoices] = useState<Invoice[]>([]);
  const [tenantIncidents, setTenantIncidents] = useState<Incident[]>([]);
  const [allIncidents, setAllIncidents] = useState<any[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addFormData, setAddFormData] = useState({ tenantId: '', roomId: '', startDate: '', endDate: '', deposit: 0, rentalPrice: 0 });
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);

  const fetchContracts = async () => {
    try {
      const [res, incRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/contracts`, { cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/incidents`, { cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (res.ok) {
        const data = await res.json();
        setContracts(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
      if (incRes.ok) {
        const data = await incRes.json();
        setAllIncidents(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách hợp đồng' });
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = async (prefillTenantId?: string) => {
    try {
      const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
      const landlordId = userStr ? (JSON.parse(userStr).landlordId || JSON.parse(userStr).id) : '';
      const [roomsRes, tenantsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/rooms?landlordId=${landlordId}`, { cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/tenants`, { cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (roomsRes.ok) {
        const rd = await roomsRes.json();
        const rooms = Array.isArray(rd.data) ? rd.data : Array.isArray(rd) ? rd : [];
        setAvailableRooms(rooms.filter((r: any) => r.status === 'VACANT'));
      }
      if (tenantsRes.ok) {
        const td = await tenantsRes.json();
        const tenants = Array.isArray(td.data) ? td.data : Array.isArray(td) ? td : [];
        setAvailableTenants(tenants.filter((t: any) => t.status === 'APPROVED'));
      }
    } catch (err) { console.error(err); }
    if (prefillTenantId) setAddFormData(prev => ({ ...prev, tenantId: prefillTenantId }));
    setShowAddModal(true);
  };

  useEffect(() => {
    if (!token) return;
    fetchContracts();
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tId = urlParams.get('tenantId');
      if (tId) { openAddModal(tId); window.history.replaceState(null, '', '/admin/contracts'); }
    }
  }, [token]);

  const { on } = useSocket({ token: token || undefined, autoConnect: !!token });
  useEffect(() => {
    if (!token || !user) return;
    const landlordId = user.landlordId || user.id;
    const unsubscribe = on(`notification-landlord-${landlordId}`, (notification: any) => {
      if (notification.title === 'Sự cố mới được báo cáo') fetchContracts();
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [on, token, user]);

  const stats = useMemo(() => {
    const active = contracts.filter(c => c.status === 'ACTIVE');
    const withIncidents = active.filter(c => allIncidents.some(inc => inc.roomId === c.roomId && inc.status !== 'RESOLVED'));
    return { total: contracts.length, active: active.length, withIncidents: withIncidents.length };
  }, [contracts, allIncidents]);

  const filtered = useMemo(() => contracts.filter(c => {
    const matchSearch = !searchQuery ||
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tenant?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.room?.roomNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchSearch && matchStatus;
  }), [contracts, searchQuery, filterStatus]);

  const loadTenantData = async (contract: Contract) => {
    try {
      const [invRes, incRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/invoices`, { cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/incidents`, { cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (invRes.ok) {
        const invData = await invRes.json();
        const all = Array.isArray(invData.data) ? invData.data : Array.isArray(invData) ? invData : [];
        setTenantInvoices(all.filter((i: any) => i.contractId === contract.id));
      }
      if (incRes.ok) {
        const incData = await incRes.json();
        const all = Array.isArray(incData.data) ? incData.data : Array.isArray(incData) ? incData : [];
        setTenantIncidents(all.filter((i: any) => i.reporterId === contract.tenant.id));
      }
    } catch (err) { console.error(err); }
  };

  const openDetailsModal = (contract: Contract) => {
    setSelectedContract(contract);
    setActiveTab('info');
    setShowDetailsModal(true);
    loadTenantData(contract);
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/incidents/${incidentId}/status`, {
        method: 'PATCH', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'RESOLVED' })
      });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã đánh dấu sự cố là đã xử lý', duration: 3000 });
        if (selectedContract) loadTenantData(selectedContract);
        setAllIncidents(prev => prev.map((inc: any) => inc.id === incidentId ? { ...inc, status: 'RESOLVED' } : inc));
        setTenantIncidents(prev => prev.map((inc: any) => inc.id === incidentId ? { ...inc, status: 'RESOLVED' } : inc));
      }
    } catch { toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái sự cố', duration: 3000 }); }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/contracts`, {
        method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...addFormData, deposit: Number(addFormData.deposit), rentalPrice: Number(addFormData.rentalPrice) })
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã tạo hợp đồng mới', duration: 3000 });
        setShowAddModal(false);
        fetchContracts();
      } else { toast({ title: 'Lỗi', description: result.message || 'Lỗi tạo hợp đồng', duration: 3000 }); }
    } catch { toast({ title: 'Lỗi', description: 'Lỗi kết nối', duration: 3000 }); }
    finally { setIsAdding(false); }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN');
  const formatCurrency = (n: number) => Number(n).toLocaleString('vi-VN') + ' đ';

  const statCards = [
    { label: 'Tổng hợp đồng', value: stats.total, color: 'indigo', icon: '📄' },
    { label: 'Đang hoạt động', value: stats.active, color: 'green', icon: '✅' },
    { label: 'Có sự cố', value: stats.withIncidents, color: 'red', icon: '⚠️' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hợp đồng</h1>
          <p className="page-subtitle">Quản lý hợp đồng thuê phòng và theo dõi tình trạng khách thuê</p>
        </div>
        <button onClick={() => openAddModal()} className="btn-primary" style={{ padding: '10px 20px', borderRadius: 12, fontSize: '0.9rem' }}>
          + Thêm hợp đồng
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {statCards.map((card, i) => (
          <div key={i} className={`stat-card ${card.color} animate-fade-in`} style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-card-label">{card.label}</span>
              <div className={`stat-card-icon ${card.color}`}>{card.icon}</div>
            </div>
            <div className="stat-card-value">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: '1 1 260px', minWidth: 220 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: 'var(--text-light-muted)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input placeholder="Tìm mã HĐ, tên khách, số phòng..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ color: 'var(--text-light-muted)', fontSize: 18, lineHeight: 1 }}>×</button>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ key: 'ALL', label: 'Tất cả' }, { key: 'ACTIVE', label: '✅ Hoạt động' }, { key: 'CANCELLED', label: '❌ Đã hủy' }].map(s => (
            <button key={s.key} onClick={() => setFilterStatus(s.key)} style={{
              padding: '8px 14px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
              border: '1px solid', borderColor: filterStatus === s.key ? 'var(--primary)' : 'var(--border-light)',
              background: filterStatus === s.key ? 'rgba(79,70,229,0.08)' : 'white',
              color: filterStatus === s.key ? 'var(--primary)' : 'var(--text-light-muted)',
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
            }}>{s.label}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-light-muted)', fontWeight: 500 }}>{filtered.length} hợp đồng</div>
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
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-title">{contracts.length === 0 ? 'Chưa có hợp đồng nào' : 'Không tìm thấy kết quả'}</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã HĐ</th>
                  <th>Khách thuê</th>
                  <th>Phòng</th>
                  <th>Thời hạn & Tiến độ</th>
                  <th>Tài chính</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const daysLeft = getDaysLeft(c.endDate);
                  const hasIncident = allIncidents.some(inc => inc.roomId === c.roomId && inc.status !== 'RESOLVED');
                  const startMs = new Date(c.startDate).getTime();
                  const endMs = new Date(c.endDate).getTime();
                  const totalDays = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
                  const elapsed = totalDays - Math.max(daysLeft, 0);
                  const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
                  return (
                    <tr key={c.id} className="animate-slide-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)', background: 'rgba(79,70,229,0.07)', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>{c.contractNumber}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.tenant ? getGradient(c.tenant.name) : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                            {c.tenant ? getInitials(c.tenant.name) : '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-light-main)' }}>{c.tenant?.name || 'N/A'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)' }}>{c.tenant?.phone || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: '1rem', background: 'rgba(79,70,229,0.07)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 8, display: 'inline-block' }}>
                          {c.room?.roomNumber || 'N/A'}
                        </span>
                      </td>
                      <td style={{ minWidth: 180 }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)', marginBottom: 6 }}>
                          {formatDate(c.startDate)} → {formatDate(c.endDate)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar-track" style={{ flex: 1 }}>
                            <div className="progress-bar-fill" style={{
                              width: `${progress}%`,
                              background: daysLeft < 30 ? 'linear-gradient(90deg,#ef4444,#f87171)' : daysLeft < 90 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#22c55e,#4ade80)'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: daysLeft < 30 ? '#dc2626' : daysLeft < 90 ? '#d97706' : '#16a34a', whiteSpace: 'nowrap' }}>
                            {daysLeft > 0 ? `${daysLeft}n` : 'Hết hạn'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light-main)' }}>{formatCurrency(c.rentalPrice)}<span style={{ fontSize: '0.72rem', color: 'var(--text-light-muted)', fontWeight: 400 }}>/th</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)' }}>Cọc: {formatCurrency(c.deposit)}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          {c.status === 'ACTIVE'
                            ? <span className="badge badge-success"><span className="badge-dot" />Đang thuê</span>
                            : <span className="badge badge-danger"><span className="badge-dot" />Đã hủy</span>
                          }
                          {hasIncident && <span className="badge badge-warning">⚠️ Có sự cố</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {c.tenant && (
                            <button onClick={() => openDetailsModal(c)} className="btn-icon btn-icon-blue">📋 Chi tiết</button>
                          )}
                          <button
                            onClick={async () => {
                              if (window.confirm('Xóa hợp đồng này? Thao tác không thể hoàn tác.')) {
                                try {
                                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/contracts/${c.id}`, { method: 'DELETE', cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } });
                                  if (res.ok) { toast({ title: 'Thành công', description: 'Đã xóa hợp đồng' }); setContracts(prev => prev.filter((con: any) => con.id !== c.id)); }
                                  else toast({ title: 'Lỗi', description: 'Không thể xóa hợp đồng' });
                                } catch { toast({ title: 'Lỗi', description: 'Không thể kết nối' }); }
                              }
                            }}
                            className="btn-icon btn-icon-red"
                          >🗑️</button>
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

      {/* Contract Details Modal */}
      {showDetailsModal && selectedContract && (
        <div className="modal-overlay">
          <div className="modal-panel-light" style={{ maxWidth: 860, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: getGradient(selectedContract.tenant.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
                  {getInitials(selectedContract.tenant.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-light-main)' }}>{selectedContract.tenant.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)' }}>Hợp đồng <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedContract.contractNumber}</span> · Phòng <strong>{selectedContract.room.roomNumber}</strong></div>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-light-muted)' }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ padding: '0 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 0, flexShrink: 0 }}>
              {([
                { key: 'info', label: '📋 Thông tin', count: null },
                { key: 'invoices', label: '💰 Hóa đơn', count: tenantInvoices.length },
                { key: 'incidents', label: '⚠️ Sự cố', count: tenantIncidents.filter(i => i.status !== 'RESOLVED').length },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: '0.85rem', fontWeight: activeTab === tab.key ? 700 : 500,
                    color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-light-muted)',
                    borderBottom: `2px solid ${activeTab === tab.key ? 'var(--primary)' : 'transparent'}`,
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <span style={{ background: tab.key === 'incidents' ? '#dc2626' : 'var(--primary)', color: 'white', borderRadius: 999, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ overflowY: 'auto', flex: 1, padding: 28 }}>
              {activeTab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {[
                    { title: '🏠 Thông tin phòng & hợp đồng', color: '#3b82f6', items: [
                      { label: 'Phòng', value: selectedContract.room.roomNumber },
                      { label: 'Khách thuê', value: selectedContract.tenant.name },
                      { label: 'SĐT', value: selectedContract.tenant.phone },
                      { label: 'Email', value: selectedContract.tenant.email },
                      { label: 'Thời gian thuê', value: `${formatDate(selectedContract.startDate)} → ${formatDate(selectedContract.endDate)}` },
                      { label: 'Trạng thái', value: selectedContract.status === 'ACTIVE' ? '✅ Đang hoạt động' : '❌ Đã hủy' },
                    ]},
                    { title: '💰 Tài chính', color: '#f59e0b', items: [
                      { label: 'Tiền thuê/tháng', value: formatCurrency(selectedContract.rentalPrice) },
                      { label: 'Tiền cọc', value: formatCurrency(selectedContract.deposit) },
                      { label: 'Tổng dư nợ', value: formatCurrency(tenantInvoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE').reduce((sum, i) => sum + i.amount, 0)) },
                      { label: 'HĐ chưa đóng', value: `${tenantInvoices.filter(i => i.status === 'UNPAID').length} hóa đơn` },
                      { label: 'HĐ quá hạn', value: `${tenantInvoices.filter(i => i.status === 'OVERDUE').length} hóa đơn` },
                    ]},
                  ].map(section => (
                    <div key={section.title} style={{ background: 'var(--bg-light-surface-alt)', borderRadius: 14, padding: '18px 20px', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: section.color, marginBottom: 14 }}>{section.title}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {section.items.map(item => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-light-muted)', flexShrink: 0 }}>{item.label}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light-main)', textAlign: 'right' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'invoices' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tenantInvoices.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">💰</div>
                      <div className="empty-state-title">Chưa có hóa đơn nào</div>
                    </div>
                  ) : tenantInvoices.map(inv => (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--bg-light-surface-alt)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{inv.invoiceNumber}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)' }}>Hạn: {formatDate(inv.dueDate)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-light-main)' }}>{formatCurrency(inv.amount)}</div>
                        {inv.status === 'PAID' ? <span className="badge badge-success" style={{ marginTop: 4 }}>Đã thanh toán</span>
                          : inv.status === 'OVERDUE' ? <span className="badge badge-danger" style={{ marginTop: 4 }}>Quá hạn</span>
                          : <span className="badge badge-warning" style={{ marginTop: 4 }}>Chưa thanh toán</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'incidents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tenantIncidents.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">✅</div>
                      <div className="empty-state-title">Không có sự cố nào</div>
                    </div>
                  ) : tenantIncidents.map(inc => (
                    <div key={inc.id} style={{ padding: '16px', background: 'var(--bg-light-surface-alt)', borderRadius: 12, border: '1px solid var(--border-light)', borderLeft: `4px solid ${inc.status === 'RESOLVED' ? '#22c55e' : '#f59e0b'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-light-main)' }}>{inc.title}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)', marginTop: 2 }}>{formatDate(inc.createdAt)}</div>
                        </div>
                        {inc.status === 'RESOLVED'
                          ? <span className="badge badge-success">✓ Đã xử lý</span>
                          : <button onClick={() => handleResolveIncident(inc.id)} className="btn-icon btn-icon-yellow" style={{ fontSize: '0.78rem' }}>✓ Xử lý xong</button>
                        }
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-light-muted)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{inc.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-panel-light" style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-light-main)' }}>Tạo hợp đồng mới</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginTop: 2 }}>Điền thông tin để tạo hợp đồng thuê phòng</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-light-muted)' }}>×</button>
            </div>
            <form onSubmit={handleAddContract} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="form-label">Khách thuê</label>
                  <select required className="form-input" value={addFormData.tenantId} onChange={e => setAddFormData({ ...addFormData, tenantId: e.target.value })}>
                    <option value="">-- Chọn khách thuê --</option>
                    {availableTenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Phòng</label>
                  <select required className="form-input" value={addFormData.roomId} onChange={e => {
                    const r = availableRooms.find(rm => rm.id === e.target.value);
                    setAddFormData({ ...addFormData, roomId: e.target.value, rentalPrice: r ? Number(r.price) : 0 });
                  }}>
                    <option value="">-- Chọn phòng --</option>
                    {availableRooms.map(r => <option key={r.id} value={r.id}>Phòng {r.roomNumber} - {Number(r.price).toLocaleString()}đ</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Ngày bắt đầu</label>
                  <input required type="date" className="form-input" value={addFormData.startDate} onChange={e => setAddFormData({ ...addFormData, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Ngày kết thúc</label>
                  <input required type="date" className="form-input" value={addFormData.endDate} onChange={e => setAddFormData({ ...addFormData, endDate: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Tiền thuê (VND/tháng)</label>
                  <input required type="number" min={0} className="form-input" value={addFormData.rentalPrice} onChange={e => setAddFormData({ ...addFormData, rentalPrice: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="form-label">Tiền cọc (VND)</label>
                  <input required type="number" min={0} className="form-input" value={addFormData.deposit} onChange={e => setAddFormData({ ...addFormData, deposit: Number(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-light" style={{ flex: 1, padding: 11, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Hủy</button>
                <button type="submit" disabled={isAdding} className="btn-primary" style={{ flex: 1, padding: 11, borderRadius: 10 }}>
                  {isAdding ? '⏳ Đang tạo...' : '✅ Lưu hợp đồng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
