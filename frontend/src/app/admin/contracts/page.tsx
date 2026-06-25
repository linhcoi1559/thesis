'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '../../../components/ui/use-toast';
import { useAuth } from '../../../context/AuthContext';

// Interfaces
interface Contract {
  id: string;
  contractNumber: string;
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

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const { token } = useAuth();

  // Contract Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  // Data for the selected tenant/contract
  const [tenantInvoices, setTenantInvoices] = useState<Invoice[]>([]);
  const [tenantIncidents, setTenantIncidents] = useState<Incident[]>([]);
  const [allIncidents, setAllIncidents] = useState<any[]>([]);

  // Add Contract Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addFormData, setAddFormData] = useState({
    tenantId: '',
    roomId: '',
    startDate: '',
    endDate: '',
    deposit: 0,
    rentalPrice: 0,
  });
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);

  const fetchContracts = async () => {
    try {
      const [res, incRes] = await Promise.all([
        fetch('http://localhost:3000/contracts', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:3000/incidents', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (res.ok) {
        const data = await res.json();
        setContracts(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
      if (incRes.ok) {
        const data = await incRes.json();
        setAllIncidents(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
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
        fetch(`http://localhost:3000/rooms?landlordId=${landlordId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:3000/tenants', { headers: { 'Authorization': `Bearer ${token}` } })
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
    } catch (err) {
      console.error(err);
    }
    
    if (prefillTenantId) {
      setAddFormData(prev => ({ ...prev, tenantId: prefillTenantId }));
    }
    setShowAddModal(true);
  };

  useEffect(() => {
    if (!token) return;
    
    fetchContracts();

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tId = urlParams.get('tenantId');
      if (tId) {
        openAddModal(tId);
        window.history.replaceState(null, '', '/admin/contracts');
      }
    }
  }, [token, toast]);

  const loadTenantData = async (contract: Contract) => {
    try {
      const [invRes, incRes] = await Promise.all([
        fetch('http://localhost:3000/invoices', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:3000/incidents', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (invRes.ok) {
        const invData = await invRes.json();
        const allInvoices = Array.isArray(invData.data) ? invData.data : Array.isArray(invData) ? invData : [];
        setTenantInvoices(allInvoices.filter((i: any) => i.contractId === contract.id));
      }
      
      if (incRes.ok) {
        const incData = await incRes.json();
        const allIncidents = Array.isArray(incData.data) ? incData.data : Array.isArray(incData) ? incData : [];
        setTenantIncidents(allIncidents.filter((i: any) => i.reporterId === contract.tenant.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openDetailsModal = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailsModal(true);
    loadTenantData(contract);
  };



  const handleResolveIncident = async (incidentId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'RESOLVED' })
      });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã đánh dấu sự cố là đã xử lý', duration: 3000 });
        if (selectedContract) loadTenantData(selectedContract);
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái sự cố', duration: 3000 });
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch('http://localhost:3000/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...addFormData,
          deposit: Number(addFormData.deposit),
          rentalPrice: Number(addFormData.rentalPrice)
        })
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã tạo hợp đồng mới', duration: 3000 });
        setShowAddModal(false);
        fetchContracts();
      } else {
        toast({ title: 'Lỗi', description: result.message || 'Lỗi tạo hợp đồng', duration: 3000 });
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Lỗi kết nối', duration: 3000 });
    } finally {
      setIsAdding(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>Quản lý Hợp đồng</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Xem thông tin hợp đồng và chi tiết khách đã thuê phòng.
          </p>
        </div>
        <button 
          onClick={() => openAddModal()}
          className="btn-primary" 
          style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.9rem' }}
        >
          + Thêm Hợp Đồng
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải danh sách...</div>
        ) : contracts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có hợp đồng nào.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Mã HĐ</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Khách thuê</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Phòng</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Thời hạn</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Tài chính</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Trạng thái</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c, idx) => (
                  <tr 
                    key={c.id} 
                    className="animate-slide-in"
                    style={{ 
                      borderBottom: idx !== contracts.length - 1 ? '1px solid var(--border-color)' : 'none',
                      transition: 'background 0.2s',
                      animationDelay: `${idx * 0.05}s`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px', fontWeight: '600', fontSize: '0.9rem' }}>
                      {c.contractNumber}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-normal)' }}>{c.tenant?.name || 'N/A'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.tenant?.phone || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      {c.room?.roomNumber || 'N/A'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--text-normal)' }}>Từ: {formatDate(c.startDate)}</div>
                      <div style={{ color: 'var(--text-muted)' }}>Đến: {formatDate(c.endDate)}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--text-normal)' }}>Giá: {Number(c.rentalPrice).toLocaleString('vi-VN')} đ</div>
                      <div style={{ color: 'var(--text-muted)' }}>Cọc: {Number(c.deposit).toLocaleString('vi-VN')} đ</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {c.status === 'ACTIVE' ? (
                        <span style={{ padding: '4px 8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Đang Thuê</span>
                      ) : (
                        <span style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Đã Hủy</span>
                      )}
                      {allIncidents.some(inc => inc.reporterId === c.tenant?.id && inc.status !== 'RESOLVED') && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                            ⚠️ Có sự cố
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {c.tenant && (
                          <button 
                            onClick={() => openDetailsModal(c)}
                            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                          >
                            Chi tiết & Quản lý
                          </button>
                        )}
                        <button 
                          onClick={async () => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa hợp đồng này không? Thao tác này không thể hoàn tác.')) {
                              try {
                                const res = await fetch(`http://localhost:3000/contracts/${c.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  toast({ title: 'Thành công', description: 'Đã xóa hợp đồng' });
                                  fetchContracts();
                                } else {
                                  toast({ title: 'Lỗi', description: 'Không thể xóa hợp đồng' });
                                }
                              } catch {
                                toast({ title: 'Lỗi', description: 'Không thể kết nối' });
                              }
                            }
                          }}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contract Details Modal */}
      {showDetailsModal && selectedContract && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '900px', padding: '30px', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-normal)' }}>Chi tiết Hợp đồng & Khách thuê</h2>
              <button onClick={() => setShowDetailsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              {/* Cột 1: Thông tin phòng & hợp đồng */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '15px', color: '#3b82f6' }}>Thông tin Phòng & Khách</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Phòng:</span> <span style={{ fontWeight: '600' }}>{selectedContract.room.roomNumber}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Khách thuê:</span> <span style={{ fontWeight: '600' }}>{selectedContract.tenant.name}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>SĐT:</span> <span style={{ fontWeight: '600' }}>{selectedContract.tenant.phone}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Thời gian thuê:</span> <span>{formatDate(selectedContract.startDate)} - {formatDate(selectedContract.endDate)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Trạng thái HĐ:</span> 
                    <span style={{ color: selectedContract.status === 'ACTIVE' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                      {selectedContract.status === 'ACTIVE' ? 'Đang hoạt động' : selectedContract.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cột 2: Trạng thái tài khoản (Hóa đơn) */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '15px', color: '#eab308' }}>Trạng thái Tài khoản</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                  {tenantInvoices.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)' }}>Chưa có hóa đơn nào được sinh ra.</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Tổng dư nợ:</span> 
                        <span style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '1.1rem' }}>
                          {tenantInvoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE').reduce((sum, i) => sum + i.amount, 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Hóa đơn chưa đóng:</span> 
                        <span style={{ fontWeight: '600' }}>{tenantInvoices.filter(i => i.status === 'UNPAID').length}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Hóa đơn quá hạn:</span> 
                        <span style={{ fontWeight: '600', color: '#ef4444' }}>{tenantInvoices.filter(i => i.status === 'OVERDUE').length}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              {/* Sự cố đã phản ánh */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '15px', color: '#eab308' }}>Sự cố đã phản ánh</h3>
                {tenantIncidents.length === 0 ? (
                  <div style={{ padding: '15px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Khách chưa báo cáo sự cố nào.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                    {tenantIncidents.map(inc => (
                      <div key={inc.id} style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: inc.status === 'RESOLVED' ? '4px solid #22c55e' : '4px solid #eab308' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{inc.title}</span>
                          {inc.status === 'RESOLVED' ? (
                            <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: '600', padding: '2px 6px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '4px' }}>Đã xử lý</span>
                          ) : (
                            <button 
                              onClick={() => handleResolveIncident(inc.id)}
                              style={{ background: '#eab308', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                            >
                              Xử lý xong
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', marginBottom: '8px' }}>{inc.description}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gửi lúc: {formatDate(inc.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contract Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '30px', margin: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-normal)' }}>Tạo Hợp Đồng Mới</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            <form onSubmit={handleAddContract} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Khách thuê</label>
                  <select required className="form-input" value={addFormData.tenantId} onChange={e => setAddFormData({...addFormData, tenantId: e.target.value})}>
                    <option value="">-- Chọn khách thuê --</option>
                    {availableTenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Phòng</label>
                  <select required className="form-input" value={addFormData.roomId} onChange={e => {
                    const r = availableRooms.find(rm => rm.id === e.target.value);
                    setAddFormData({...addFormData, roomId: e.target.value, rentalPrice: r ? Number(r.price) : 0});
                  }}>
                    <option value="">-- Chọn phòng --</option>
                    {availableRooms.map(r => (
                      <option key={r.id} value={r.id}>Phòng {r.roomNumber} - {Number(r.price).toLocaleString()}đ</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Ngày bắt đầu</label>
                  <input required type="date" className="form-input" value={addFormData.startDate} onChange={e => setAddFormData({...addFormData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Ngày kết thúc</label>
                  <input required type="date" className="form-input" value={addFormData.endDate} onChange={e => setAddFormData({...addFormData, endDate: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Tiền thuê (VND/tháng)</label>
                  <input required type="number" min={0} className="form-input" value={addFormData.rentalPrice} onChange={e => setAddFormData({...addFormData, rentalPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="form-label">Tiền cọc (VND)</label>
                  <input required type="number" min={0} className="form-input" value={addFormData.deposit} onChange={e => setAddFormData({...addFormData, deposit: Number(e.target.value)})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Hủy</button>
                <button type="submit" disabled={isAdding} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
                  {isAdding ? 'Đang tạo...' : 'Lưu Hợp Đồng'}
                </button>
              </div>
            </form>
            <div>
              {/* Sự cố đã phản ánh */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '15px', color: '#eab308' }}>Sự cố đã phản ánh</h3>
                {tenantIncidents.length === 0 ? (
                  <div style={{ padding: '15px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Khách chưa báo cáo sự cố nào.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                    {tenantIncidents.map(inc => (
                      <div key={inc.id} style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: inc.status === 'RESOLVED' ? '4px solid #22c55e' : '4px solid #eab308' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{inc.title}</span>
                          {inc.status === 'RESOLVED' ? (
                            <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: '600', padding: '2px 6px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '4px' }}>Đã xử lý</span>
                          ) : (
                            <button onClick={() => handleResolveIncident(inc.id)} style={{ background: '#eab308', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>Đánh dấu xử lý xong</button>
                          )}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>{inc.description}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '8px' }}>Gửi lúc: {new Date(inc.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
