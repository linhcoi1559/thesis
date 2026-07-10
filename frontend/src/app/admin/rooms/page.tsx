'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../../components/ui/use-toast';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

interface ContractInfo {
  id: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  startDate: string;
  endDate: string;
  rentalPrice: number;
  status: string;
}

interface Room {
  id: string;
  roomNumber: string;
  price: string;
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  description: string;
  imageUrls: string[];
  contractInfo?: ContractInfo;
}

const STATUS_CONFIG = {
  VACANT: { label: 'Còn trống', color: 'green', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', text: '#16a34a', dot: '#22c55e' },
  OCCUPIED: { label: 'Đang thuê', color: 'red', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#dc2626', dot: '#ef4444' },
  MAINTENANCE: { label: 'Bảo trì', color: 'yellow', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: '#d97706', dot: '#f59e0b' },
};

export default function AdminRoomsPage() {
  const { user, token } = useAuth();
  const landlordId = user?.landlordId || user?.id || '';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const { toast } = useToast();

  // Modal states
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({ roomNumber: '', price: '', status: 'VACANT', description: '' });
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const [roomsRes, contractsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/rooms?landlordId=${landlordId}`, { cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/contracts`, { cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        const allRooms: any[] = Array.isArray(roomsData) ? roomsData : [];
        const contractByRoomNumber: Record<string, ContractInfo> = {};
        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          const allContracts: any[] = Array.isArray(contractsData.data) ? contractsData.data : Array.isArray(contractsData) ? contractsData : [];
          allContracts.filter((c: any) => c.status === 'ACTIVE').forEach((c: any) => {
            if (c.room?.roomNumber) {
              contractByRoomNumber[c.room.roomNumber] = {
                id: c.id, tenantName: c.tenant?.name || 'N/A', tenantPhone: c.tenant?.phone || 'N/A',
                tenantEmail: c.tenant?.email || 'N/A', startDate: c.startDate, endDate: c.endDate,
                rentalPrice: c.rentalPrice, status: c.status,
              };
            }
          });
        }
        setRooms(allRooms.map((room: any) => ({ ...room, contractInfo: contractByRoomNumber[room.roomNumber] || undefined })));
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách phòng.', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchRooms(); }, [token]);

  const stats = useMemo(() => ({
    total: rooms.length,
    vacant: rooms.filter(r => r.status === 'VACANT').length,
    occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
    maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
  }), [rooms]);

  const filtered = useMemo(() => rooms.filter(r => {
    const matchSearch = !searchQuery || r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.contractInfo?.tenantName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchSearch && matchStatus;
  }), [rooms, searchQuery, filterStatus]);

  const handleOpenRoomModal = (room?: Room) => {
    if (room) { setEditingRoom(room); setFormData({ roomNumber: room.roomNumber, price: room.price, status: room.status, description: room.description || '' }); }
    else { setEditingRoom(null); setFormData({ roomNumber: '', price: '', status: 'VACANT', description: '' }); }
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRoom ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/rooms/${editingRoom.id}` : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/rooms`;
      const response = await fetch(url, {
        method: editingRoom ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, landlordId }),
      });
      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đã lưu thông tin phòng.', duration: 3000 });
        setIsRoomModalOpen(false);
        fetchRooms();
      } else { toast({ title: 'Lỗi', description: 'Không thể lưu phòng.', duration: 3000 }); }
    } catch { toast({ title: 'Lỗi', description: 'Lỗi kết nối server.', duration: 3000 }); }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng này?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/rooms/${id}?landlordId=${landlordId}`, {
        method: 'DELETE', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ landlordId }),
      });
      if (response.ok) { toast({ title: 'Thành công', description: 'Đã xóa phòng.', duration: 3000 }); fetchRooms(); }
    } catch { toast({ title: 'Lỗi', description: 'Không thể xóa phòng.', duration: 3000 }); }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedRoom) return;
    const file = e.target.files[0];
    const fd = new FormData();
    // Non-file fields MUST be appended before file fields when using Multer
    fd.append('landlordId', landlordId);
    fd.append('file', file);
    setUploadingImage(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/rooms/${selectedRoom.id}/images`, { method: 'POST', cache: 'no-store', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      if (response.ok) {
        const updatedRoom = await response.json();
        setSelectedRoom(updatedRoom);
        fetchRooms();
        toast({ title: 'Thành công', description: 'Đã tải ảnh lên.', duration: 3000 });
      }
    } catch { toast({ title: 'Lỗi', description: 'Lỗi tải ảnh.', duration: 3000 }); }
    finally { setUploadingImage(false); }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!selectedRoom || !confirm('Xóa ảnh này?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/rooms/${selectedRoom.id}/images`, {
        method: 'DELETE', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ landlordId, imageUrl }),
      });
      if (response.ok) { const updatedRoom = await response.json(); setSelectedRoom(updatedRoom); fetchRooms(); }
    } catch { toast({ title: 'Lỗi', description: 'Không thể xóa ảnh.', duration: 3000 }); }
  };

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
  const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : 'N/A';

  const statCards = [
    { label: 'Tổng phòng', value: stats.total, color: 'indigo', icon: '🏠' },
    { label: 'Còn trống', value: stats.vacant, color: 'green', icon: '✅' },
    { label: 'Đang thuê', value: stats.occupied, color: 'blue', icon: '👤' },
    { label: 'Bảo trì', value: stats.maintenance, color: 'yellow', icon: '🔧' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý phòng</h1>
          <p className="page-subtitle">Quản lý danh sách phòng, ảnh và thông tin hợp đồng</p>
        </div>
        <button onClick={() => handleOpenRoomModal()} className="btn-primary" style={{ padding: '10px 20px', borderRadius: 12, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>+</span> Thêm phòng mới
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
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

      {/* Occupancy Progress */}
      {rooms.length > 0 && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border-light)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--neo-shadow)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light-muted)', whiteSpace: 'nowrap' }}>Tỉ lệ lấp đầy</span>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${(stats.occupied / stats.total) * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{Math.round((stats.occupied / stats.total) * 100)}%</span>
        </div>
      )}

      {/* Filters Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: '1 1 240px', minWidth: 200 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: 'var(--text-light-muted)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input placeholder="Tìm phòng, khách thuê..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'VACANT', 'OCCUPIED', 'MAINTENANCE'] as const).map(s => {
            const cfg = s !== 'ALL' ? STATUS_CONFIG[s] : null;
            return (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: '7px 13px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
                border: '1px solid', borderColor: filterStatus === s ? (cfg?.border || 'var(--primary)') : 'var(--border-light)',
                background: filterStatus === s ? (cfg?.bg || 'rgba(79,70,229,0.08)') : 'white',
                color: filterStatus === s ? (cfg?.text || 'var(--primary)') : 'var(--text-light-muted)',
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
              }}>
                {s === 'ALL' ? 'Tất cả' : cfg?.label}
              </button>
            );
          })}
        </div>
        {/* View toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', background: 'var(--bg-light-surface-alt)', borderRadius: 10, padding: 3, border: '1px solid var(--border-light)', gap: 2 }}>
          {(['grid', 'table'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
              background: viewMode === mode ? 'white' : 'transparent',
              color: viewMode === mode ? 'var(--text-light-main)' : 'var(--text-light-muted)',
              border: viewMode === mode ? '1px solid var(--border-light)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
              boxShadow: viewMode === mode ? 'var(--neo-shadow)' : 'none',
            }}>
              {mode === 'grid' ? '⊞ Lưới' : '☰ Bảng'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border-light)', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(79,70,229,0.15)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ color: 'var(--text-light-muted)', fontSize: '0.9rem' }}>Đang tải dữ liệu...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border-light)', boxShadow: 'var(--neo-shadow)' }}>
          <div className="empty-state">
            <div className="empty-state-icon">🏠</div>
            <div className="empty-state-title">{rooms.length === 0 ? 'Chưa có phòng nào' : 'Không tìm thấy phòng phù hợp'}</div>
            {rooms.length === 0 && (
              <button onClick={() => handleOpenRoomModal()} className="btn-primary" style={{ padding: '10px 20px', borderRadius: 12, marginTop: 8 }}>+ Thêm phòng đầu tiên</button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        // GRID VIEW
        <div className="card-grid">
          {filtered.map((room, idx) => {
            const cfg = STATUS_CONFIG[room.status];
            return (
              <div key={room.id} className="room-card animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                {/* Room Image / Placeholder */}
                <div style={{ height: 160, background: room.imageUrls?.[0] ? 'none' : `linear-gradient(135deg, ${room.status === 'VACANT' ? '#22c55e22,#4ade8022' : room.status === 'OCCUPIED' ? '#3b82f622,#6366f122' : '#f59e0b22,#fbbf2422'})`, position: 'relative', overflow: 'hidden' }}>
                  {room.imageUrls?.[0] ? (
                    <img src={room.imageUrls[0]} alt={`Phòng ${room.roomNumber}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem', opacity: 0.5 }}>🏠</div>
                  )}
                  {/* Status badge overlay */}
                  <div style={{ position: 'absolute', top: 10, right: 10, padding: '4px 10px', borderRadius: 999, background: cfg.bg, color: cfg.text, fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${cfg.border}`, backdropFilter: 'blur(8px)' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: cfg.dot, marginRight: 5 }} />
                    {cfg.label}
                  </div>
                  {/* Image count */}
                  {room.imageUrls?.length > 0 && (
                    <div style={{ position: 'absolute', bottom: 10, left: 10, padding: '3px 8px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.7rem', fontWeight: 600 }}>
                      📷 {room.imageUrls.length} ảnh
                    </div>
                  )}
                </div>
                {/* Card Content */}
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-light-main)' }}>Phòng {room.roomNumber}</div>
                      {room.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)', marginTop: 2 }}>{room.description}</div>}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{formatCurrency(room.price)}<span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-light-muted)' }}>/th</span></div>
                  </div>
                  {/* Tenant info if OCCUPIED */}
                  {room.status === 'OCCUPIED' && room.contractInfo ? (
                    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                          {room.contractInfo.tenantName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-light-main)' }}>{room.contractInfo.tenantName}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)', paddingLeft: 30 }}>📞 {room.contractInfo.tenantPhone}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)', paddingLeft: 30 }}>📅 {formatDate(room.contractInfo.startDate)} → {formatDate(room.contractInfo.endDate)}</div>
                    </div>
                  ) : room.status === 'VACANT' ? (
                    <Link href="/admin/contracts" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600, padding: '7px 12px', background: 'rgba(139,92,246,0.08)', borderRadius: 8, border: '1px solid rgba(139,92,246,0.2)', textDecoration: 'none', transition: 'all 0.2s' }}>
                      ➕ Tạo hợp đồng cho phòng này
                    </Link>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#d97706', background: 'rgba(245,158,11,0.08)', padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>🔧 Phòng đang trong quá trình bảo trì</div>
                  )}
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, paddingTop: 4, borderTop: '1px solid var(--border-light)' }}>
                    <button onClick={() => { setSelectedRoom(room); setIsImageModalOpen(true); }} className="btn-icon btn-icon-purple" style={{ flex: 1, justifyContent: 'center' }}>📷 Ảnh</button>
                    <button onClick={() => handleOpenRoomModal(room)} className="btn-icon btn-icon-blue" style={{ flex: 1, justifyContent: 'center' }}>✏️ Sửa</button>
                    <button onClick={() => handleDeleteRoom(room.id)} className="btn-icon btn-icon-red" style={{ flex: 1, justifyContent: 'center' }}>🗑️ Xóa</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // TABLE VIEW
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border-light)', boxShadow: 'var(--neo-shadow)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Phòng</th>
                  <th>Giá thuê</th>
                  <th>Trạng thái</th>
                  <th>Khách thuê & Hợp đồng</th>
                  <th>Ảnh</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((room, idx) => {
                  const cfg = STATUS_CONFIG[room.status];
                  return (
                    <tr key={room.id} className="animate-slide-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-light-main)' }}>Phòng {room.roomNumber}</div>
                        {room.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-light-muted)', marginTop: 2, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.description}</div>}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>{formatCurrency(room.price)}</td>
                      <td>
                        <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />{cfg.label}
                        </span>
                      </td>
                      <td style={{ minWidth: 220 }}>
                        {room.status === 'OCCUPIED' && room.contractInfo ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-light-main)' }}>{room.contractInfo.tenantName}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)' }}>📞 {room.contractInfo.tenantPhone}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-light-muted)' }}>📅 {formatDate(room.contractInfo.startDate)} → {formatDate(room.contractInfo.endDate)}</div>
                            <Link href="/admin/contracts" style={{ fontSize: '0.72rem', color: '#2563eb', textDecoration: 'none', marginTop: 2 }}>Xem hợp đồng →</Link>
                          </div>
                        ) : room.status === 'VACANT' ? (
                          <Link href="/admin/contracts" style={{ fontSize: '0.8rem', color: '#7c3aed', textDecoration: 'none' }}>➕ Tạo hợp đồng</Link>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#d97706' }}>🔧 Bảo trì</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-light-muted)', fontSize: '0.9rem' }}>{room.imageUrls?.length || 0} ảnh</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => { setSelectedRoom(room); setIsImageModalOpen(true); }} className="btn-icon btn-icon-purple">📷</button>
                          <button onClick={() => handleOpenRoomModal(room)} className="btn-icon btn-icon-blue">✏️ Sửa</button>
                          <button onClick={() => handleDeleteRoom(room.id)} className="btn-icon btn-icon-red">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Room Form Modal */}
      {isRoomModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel-light" style={{ maxWidth: 500 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-light-main)' }}>{editingRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginTop: 2 }}>{editingRoom ? `Phòng ${editingRoom.roomNumber}` : 'Điền thông tin phòng mới'}</p>
              </div>
              <button onClick={() => setIsRoomModalOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-light-muted)' }}>×</button>
            </div>
            <form onSubmit={handleSaveRoom} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="form-label">Mã/Số phòng</label>
                  <input className="form-input" required value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} placeholder="VD: 101" />
                </div>
                <div>
                  <label className="form-label">Giá thuê (VNĐ/tháng)</label>
                  <input className="form-input" type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="2000000" />
                </div>
              </div>
              <div>
                <label className="form-label">Trạng thái</label>
                <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="VACANT">Còn trống</option>
                  <option value="OCCUPIED">Đã thuê</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                </select>
              </div>
              <div>
                <label className="form-label">Mô tả (tùy chọn)</label>
                <textarea className="form-input" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Phòng có điều hòa, nóng lạnh..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setIsRoomModalOpen(false)} className="btn-light" style={{ flex: 1, padding: 11, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: 11, borderRadius: 10 }}>
                  {editingRoom ? '✅ Lưu thay đổi' : '➕ Thêm phòng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      {isImageModalOpen && selectedRoom && (
        <div className="modal-overlay">
          <div className="modal-panel-light" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-light-main)' }}>Ảnh phòng {selectedRoom.roomNumber}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light-muted)', marginTop: 2 }}>Tải lên hình ảnh để hiển thị trên Landing Page</p>
              </div>
              <button onClick={() => { setIsImageModalOpen(false); fetchRooms(); }} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-light-surface-alt)', border: '1px solid var(--border-light)', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-light-muted)' }}>×</button>
            </div>
            <div style={{ padding: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
                {selectedRoom.imageUrls?.map(url => (
                  <div key={url} style={{ position: 'relative', height: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--neo-shadow)' }}>
                    <img src={url} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => handleDeleteImage(url)}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,0.85)', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '1rem', backdropFilter: 'blur(4px)' }}
                    >×</button>
                  </div>
                ))}
                {(!selectedRoom.imageUrls || selectedRoom.imageUrls.length === 0) && (
                  <div style={{ gridColumn: '1 / -1', padding: 32, textAlign: 'center', color: 'var(--text-light-muted)', border: '2px dashed var(--border-light)', borderRadius: 12, fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 8, opacity: 0.5 }}>📷</div>
                    Phòng này chưa có ảnh nào
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <label className="btn-primary" style={{ cursor: 'pointer', opacity: uploadingImage ? 0.6 : 1, padding: '10px 20px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {uploadingImage ? '⏳ Đang tải...' : '📤 Tải ảnh lên'}
                  <input type="file" accept="image/*" onChange={handleUploadImage} disabled={uploadingImage} style={{ display: 'none' }} />
                </label>
                <button onClick={() => { setIsImageModalOpen(false); fetchRooms(); }} className="btn-light" style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
