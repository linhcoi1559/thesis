'use client';
import React, { useEffect, useState } from 'react';
import { useToast } from './use-toast';

export function Toaster() {
  const { activeToast } = useToast();

  if (!activeToast) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      background: 'var(--bg-surface-hover, #222)',
      border: '1px solid var(--border-color, #444)',
      color: '#fff',
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: '300px',
      animation: 'slide-in 0.3s ease-out'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: activeToast.title === 'Lỗi' ? '#ef4444' : '#22c55e' }}>{activeToast.title}</div>
      <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{activeToast.description}</div>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
