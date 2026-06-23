'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '../../../components/ui/use-toast';

interface Room {
  id: string;
  roomNumber: string;
  price: string;
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  description: string;
  imageUrls: string[];
}

export default function AdminRoomsPage() {
  const landlordId = 'e29d665b-efbe-40b3-bb66-df30bd5e8bf8'; // Mock Landlord ID
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
      const response = await fetch(`http://localhost:3000/rooms?landlordId=${landlordId}`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách phòng.', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

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
      setFormData({
        roomNumber: '',
        price: '',
        status: 'VACANT',
        description: '',
      });
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, landlordId }),
      });

      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đã lưu thông tin phòng.', duration: 3000 });
        setIsRoomModalOpen(false);
        fetchRooms();
      } else {
        toast({ title: 'Lỗi', description: 'Không thể lưu phòng.', duration: 3000 });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Lỗi kết nối server.', duration: 3000 });
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng này?')) return;
    try {
      const response = await fetch(`http://localhost:3000/rooms/${id}?landlordId=${landlordId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId }),
      });
      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đã xóa phòng.', duration: 3000 });
        fetchRooms();
      }
    } catch (error) {
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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('landlordId', landlordId);

    setUploadingImage(true);
    try {
      const response = await fetch(`http://localhost:3000/rooms/${selectedRoom.id}/images`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đã tải ảnh lên.', duration: 3000 });
        fetchRooms();
        // Update local selectedRoom to show immediately
        const updatedRoom = await response.json();
        setSelectedRoom(updatedRoom);
      } else {
        toast({ title: 'Lỗi', description: 'Không thể tải ảnh.', duration: 3000 });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Lỗi kết nối khi tải ảnh.', duration: 3000 });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!selectedRoom) return;
    if (!confirm('Xóa ảnh này?')) return;

    try {
      const response = await fetch(`http://localhost:3000/rooms/${selectedRoom.id}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId, imageUrl }),
      });

      if (response.ok) {
        toast({ title: 'Thành công', description: 'Đã xóa ảnh.', duration: 3000 });
        fetchRooms();
        const updatedRoom = await response.json();
        setSelectedRoom(updatedRoom);
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa ảnh.', duration: 3000 });
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Quản Lý Phòng</h1>
        <button onClick={() => handleOpenRoomModal()} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          + Thêm Phòng Mới
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>Phòng</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>Giá thuê</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>Trạng thái</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>Số ảnh</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px', fontWeight: '600' }}>{room.roomNumber}</td>
                  <td style={{ padding: '16px', color: 'var(--primary)' }}>{formatCurrency(room.price)}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      backgroundColor: room.status === 'VACANT' ? 'var(--status-success-bg)' : 
                                       room.status === 'OCCUPIED' ? 'var(--status-error-bg)' : 'var(--status-pending-bg)',
                      color: room.status === 'VACANT' ? 'var(--status-success-text)' : 
                             room.status === 'OCCUPIED' ? 'var(--status-error-text)' : 'var(--status-pending-text)'
                    }}>
                      {room.status === 'VACANT' ? 'Còn Trống' : room.status === 'OCCUPIED' ? 'Đã Thuê' : 'Bảo Trì'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>{room.imageUrls?.length || 0} ảnh</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => handleOpenImageModal(room)} style={{ marginRight: '12px', color: '#a855f7', textDecoration: 'underline' }}>Ảnh</button>
                    <button onClick={() => handleOpenRoomModal(room)} style={{ marginRight: '12px', color: '#3b82f6', textDecoration: 'underline' }}>Sửa</button>
                    <button onClick={() => handleDeleteRoom(room.id)} style={{ color: '#ef4444', textDecoration: 'underline' }}>Xóa</button>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có phòng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Room Form Modal */}
      {isRoomModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '24px' }}>
              {editingRoom ? 'Chỉnh Sửa Phòng' : 'Thêm Phòng Mới'}
            </h2>
            <form onSubmit={handleSaveRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Mã/Số Phòng</label>
                <input className="form-input" required value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Giá thuê (VNĐ)</label>
                <input className="form-input" type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Trạng thái</label>
                <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="VACANT">Còn Trống</option>
                  <option value="OCCUPIED">Đã Thuê</option>
                  <option value="MAINTENANCE">Bảo Trì</option>
                </select>
              </div>
              <div>
                <label className="form-label">Mô tả</label>
                <textarea className="form-input" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
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
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 68, 0.8)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
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
              <label className="btn-primary" style={{ cursor: 'pointer', background: 'var(--primary)', opacity: uploadingImage ? 0.5 : 1 }}>
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
