'use client';

import React, { useState, useEffect } from 'react';
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

export default function AdminRoomsPage() {
  const { user, token } = useAuth();
  const landlordId = user?.landlordId || user?.id || '';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Modal states
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    price: '',
    status: 'VACANT',
    description: '',
  });

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const [roomsRes, contractsRes] = await Promise.all([
        fetch(`http://localhost:3000/rooms?landlordId=${landlordId}`, { cache: "no-store", headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3000/contracts', { cache: "no-store", headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        const allRooms: any[] = Array.isArray(roomsData) ? roomsData : [];

        // Xây dựng map roomNumber → contract ACTIVE
        const contractByRoomNumber: Record<string, ContractInfo> = {};
        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          const allContracts: any[] = Array.isArray(contractsData.data)
            ? contractsData.data
            : Array.isArray(contractsData) ? contractsData : [];

          allContracts
            .filter((c: any) => c.status === 'ACTIVE')
            .forEach((c: any) => {
              if (c.room?.roomNumber) {
                contractByRoomNumber[c.room.roomNumber] = {
                  id: c.id,
                  tenantName: c.tenant?.name || 'N/A',
                  tenantPhone: c.tenant?.phone || 'N/A',
                  tenantEmail: c.tenant?.email || 'N/A',
                  startDate: c.startDate,
                  endDate: c.endDate,
                  rentalPrice: c.rentalPrice,
                  status: c.status,
                };
              }
            });
        }

        // Gắn thông tin hợp đồng vào phòng
        const roomsWithContracts: Room[] = allRooms.map((room: any) => ({
          ...room,
          contractInfo: contractByRoomNumber[room.roomNumber] || undefined,
        }));

        setRooms(roomsWithContracts);
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách phòng.', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRooms();
  }, [token]);

  const handleOpenRoomModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        roomNumber: room.roomNumber,
        price: room.price,
        status: room.status,
        description: room.description || '',
      });
    } else {
      setEditingRoom(null);
      setFormData({ roomNumber: '', price: '', status: 'VACANT', description: '' });
    }
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRoom
        ? `http://localhost:3000/rooms/${editingRoom.id}`
        : `http://localhost:3000/rooms`;
      const method = editingRoom ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, landlordId }),
      });

      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đã lưu thông tin phòng.', duration: 3000 });
        setIsRoomModalOpen(false);
        fetchRooms();
      } else {
        toast({ title: 'Lỗi', description: 'Không thể lưu phòng.', duration: 3000 });
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Lỗi kết nối server.', duration: 3000 });
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng này?')) return;
    try {
      const response = await fetch(`http://localhost:3000/rooms/${id}?landlordId=${landlordId}`, { method: 'DELETE', cache: "no-store", headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ landlordId }),
      });
      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đã xóa phòng.', duration: 3000 });
        fetchRooms();
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể xóa phòng.', duration: 3000 });
    }
  };

  const handleOpenImageModal = (room: Room) => {
    setSelectedRoom(room);
    setIsImageModalOpen(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedRoom) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append('file', file);
    fd.append('landlordId', landlordId);
    setUploadingImage(true);
    try {
      const response = await fetch(`http://localhost:3000/rooms/${selectedRoom.id}/images`, { method: 'POST', cache: "no-store", headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đã tải ảnh lên.', duration: 3000 });
        const updatedRoom = await response.json();
        setSelectedRoom(updatedRoom);
        fetchRooms();
      } else {
        toast({ title: 'Lỗi', description: 'Không thể tải ảnh.', duration: 3000 });
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Lỗi kết nối khi tải ảnh.', duration: 3000 });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!selectedRoom || !confirm('Xóa ảnh này?')) return;
    try {
      const response = await fetch(`http://localhost:3000/rooms/${selectedRoom.id}/images`, { method: 'DELETE', cache: "no-store", headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ landlordId, imageUrl }),
      });
      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đã xóa ảnh.', duration: 3000 });
        const updatedRoom = await response.json();
        setSelectedRoom(updatedRoom);
        fetchRooms();
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể xóa ảnh.', duration: 3000 });
    }
  };

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const vacantCount = rooms.filter(r => r.status === 'VACANT').length;
  const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;
  const maintenanceCount = rooms.filter(r => r.status === 'MAINTENANCE').length;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '12px' }}>Quản Lý Phòng</h1>

          {/* Summary Stats */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: '600' }}>
                {vacantCount} Còn trống
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '600' }}>
                {occupiedCount} Đã thuê
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
              <span style={{ fontSize: '0.85rem', color: '#eab308', fontWeight: '600' }}>
                {maintenanceCount} Bảo trì
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => handleOpenRoomModal()} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          + Thêm Phòng Mới
        </button>
      </div>

      {/* Rooms Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Phòng</th>
                  <th style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Giá thuê</th>
                  <th style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Trạng thái</th>
                  <th style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Khách thuê & Hợp đồng</th>
                  <th style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Số ảnh</th>
                  <th style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, idx) => (
                  <tr
                    key={room.id}
                    style={{
                      borderBottom: idx !== rooms.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Phòng */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Phòng {room.roomNumber}</div>
                      {room.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {room.description}
                        </div>
                      )}
                    </td>

                    {/* Giá thuê */}
                    <td style={{ padding: '16px 20px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.95rem' }}>
                      {formatCurrency(room.price)}
                    </td>

                    {/* Trạng thái */}
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '5px 14px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        display: 'inline-block',
                        backgroundColor: room.status === 'VACANT' ? 'rgba(34,197,94,0.15)' :
                          room.status === 'OCCUPIED' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                        color: room.status === 'VACANT' ? '#22c55e' :
                          room.status === 'OCCUPIED' ? '#ef4444' : '#eab308',
                        border: `1px solid ${room.status === 'VACANT' ? 'rgba(34,197,94,0.3)' :
                          room.status === 'OCCUPIED' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}`,
                      }}>
                        {room.status === 'VACANT' ? '● Còn Trống' : room.status === 'OCCUPIED' ? '● Đã Thuê' : '● Bảo Trì'}
                      </span>
                    </td>

                    {/* Khách thuê & Hợp đồng */}
                    <td style={{ padding: '16px 20px', minWidth: '220px' }}>
                      {room.status === 'OCCUPIED' && room.contractInfo ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-normal)', fontSize: '0.95rem' }}>
                            {room.contractInfo.tenantName}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            📞 {room.contractInfo.tenantPhone}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            📅 {formatDate(room.contractInfo.startDate)} → {formatDate(room.contractInfo.endDate)}
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <Link
                              href="/admin/contracts"
                              style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none', padding: '3px 8px', background: 'rgba(59,130,246,0.1)', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.2)' }}
                            >
                              Xem hợp đồng →
                            </Link>
                          </div>
                        </div>
                      ) : room.status === 'OCCUPIED' && !room.contractInfo ? (
                        // OCCUPIED nhưng không tìm thấy HĐ ACTIVE (dữ liệu không nhất quán)
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#eab308' }}>⚠ Không có HĐ ACTIVE</span>
                          <Link href="/admin/contracts" style={{ fontSize: '0.75rem', color: '#a855f7', textDecoration: 'underline' }}>
                            + Tạo hợp đồng
                          </Link>
                        </div>
                      ) : room.status === 'VACANT' ? (
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#22c55e', marginBottom: '4px' }}>
                            ✓ Sẵn sàng cho thuê
                          </div>
                          <Link
                            href="/admin/contracts"
                            style={{ fontSize: '0.75rem', color: '#a855f7', textDecoration: 'none', padding: '3px 8px', background: 'rgba(168,85,247,0.1)', borderRadius: '4px', border: '1px solid rgba(168,85,247,0.2)' }}
                          >
                            + Tạo hợp đồng
                          </Link>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>— Đang bảo trì</span>
                      )}
                    </td>

                    {/* Số ảnh */}
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {room.imageUrls?.length || 0} ảnh
                    </td>

                    {/* Thao tác */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenImageModal(room)}
                          style={{ color: '#a855f7', background: 'rgba(168,85,247,0.1)', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}
                        >
                          Ảnh
                        </button>
                        <button
                          onClick={() => handleOpenRoomModal(room)}
                          style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Chưa có phòng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Room Form Modal */}
      {isRoomModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', margin: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '24px' }}>
              {editingRoom ? 'Chỉnh Sửa Phòng' : 'Thêm Phòng Mới'}
            </h2>
            <form onSubmit={handleSaveRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Mã/Số Phòng</label>
                <input className="form-input" required value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Giá thuê (VNĐ)</label>
                <input className="form-input" type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Trạng thái</label>
                <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="VACANT">Còn Trống</option>
                  <option value="OCCUPIED">Đã Thuê</option>
                  <option value="MAINTENANCE">Bảo Trì</option>
                </select>
              </div>
              <div>
                <label className="form-label">Mô tả</label>
                <textarea className="form-input" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsRoomModalOpen(false)} className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Lưu Lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      {isImageModalOpen && selectedRoom && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto', margin: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>
              Quản Lý Ảnh: Phòng {selectedRoom.roomNumber}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Tải lên hình ảnh cho phòng này để hiển thị ở Landing Page.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {selectedRoom.imageUrls?.map(url => (
                <div key={url} style={{ position: 'relative', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={url} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => handleDeleteImage(url)}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239,68,68,0.8)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {(!selectedRoom.imageUrls || selectedRoom.imageUrls.length === 0) && (
                <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px' }}>
                  Phòng này chưa có ảnh nào.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="btn-primary" style={{ cursor: 'pointer', opacity: uploadingImage ? 0.5 : 1 }}>
                {uploadingImage ? 'Đang tải...' : '+ Tải Ảnh Lên'}
                <input type="file" accept="image/*" onChange={handleUploadImage} disabled={uploadingImage} style={{ display: 'none' }} />
              </label>
              <button onClick={() => { setIsImageModalOpen(false); fetchRooms(); }} className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
