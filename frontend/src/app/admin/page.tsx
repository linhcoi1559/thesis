'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';

interface RentRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  status: 'PENDING' | 'CONTACTED' | 'CANCELLED';
  createdAt: string;
  room?: {
    roomNumber: string;
  };
}

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<RentRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const token = (typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : '') || 'demo-token';

  const { on } = useSocket({
    token,
    autoConnect: !!token,
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3000/rent-requests', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Lấy danh sách yêu cầu thất bại');
        }

        const list = Array.isArray(result) ? result : result.data || [];
        setRequests(list);
      } catch (error: any) {
        setErrorMessage(error.message || 'Lỗi kết nối server');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchRequests();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const unsubscribe = on('new-rent-request', (newRequest: any) => {
      setRequests((prev) => [newRequest, ...prev]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [on, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>Danh sách đăng ký tư vấn</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Quản lý các yêu cầu tư vấn thuê phòng từ khách hàng (Cập nhật thời gian thực)
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tổng số yêu cầu</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>{requests.length}</div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải danh sách...</div>
        ) : errorMessage ? (
          <div style={{ padding: '20px', margin: '20px', background: 'var(--status-error-bg)', color: 'var(--status-error-text)', borderRadius: '8px', fontSize: '0.9rem' }}>
            {errorMessage}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có yêu cầu tư vấn nào được gửi.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Khách hàng</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Liên hệ</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Lời nhắn</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Thời gian</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => (
                  <tr 
                    key={req.id} 
                    className="animate-slide-in"
                    style={{ 
                      borderBottom: idx !== requests.length - 1 ? '1px solid var(--border-color)' : 'none',
                      transition: 'background 0.2s',
                      animationDelay: `${idx * 0.05}s`
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{req.name}</div>
                      {req.room && (
                        <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: 'var(--primary-glow)', color: '#fff', fontSize: '0.75rem' }}>
                          Phòng: {req.room.roomNumber}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '500' }}>{req.phone}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px', maxWidth: '300px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.message}>
                        {req.message || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Không có lời nhắn</span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatDate(req.createdAt)}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        padding: '4px 12px', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        background: 'var(--status-pending-bg)',
                        color: 'var(--status-pending-text)'
                      }}>
                        Chờ liên hệ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
