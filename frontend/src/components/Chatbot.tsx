
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TenantContext {
  tenantName?: string;
  contract?: {
    roomNumber?: string;
    startDate?: string;
    endDate?: string;
    rentalPrice?: number;
    electricityPrice?: number;
    waterPrice?: number;
    memberCount?: number;
  } | null;
  invoices?: { amount: number; status: string; dueDate: string }[];
  violations?: { description: string; status: string }[];
  incidents?: { title: string; description: string; status: string }[];
}

interface ChatbotProps {
  tenantContext?: TenantContext;
}

const QUICK_QUESTIONS = [
  '📋 Hóa đơn của tôi bao nhiêu?',
  '📅 Hợp đồng còn bao lâu?',
  '⚠️ Tôi có vi phạm gì không?',
  '🔧 Làm sao báo sự cố?',
];

export default function Chatbot({ tenantContext }: ChatbotProps) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    {
      role: 'bot',
      text: tenantContext?.tenantName
        ? `Xin chào **${tenantContext.tenantName}**! 👋 Tôi là trợ lý AI cá nhân của bạn.

Tôi biết thông tin phòng, hóa đơn và hợp đồng của bạn — hãy hỏi tôi bất kỳ điều gì!`
        : `Xin chào! 👋 Tôi là RentBot, trợ lý AI của Smart Boarding House.

Tôi có thể giúp bạn tìm phòng phù hợp, tư vấn giá cả và thời gian thuê tốt nhất. Bạn muốn hỏi gì?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const endpoint = tenantContext ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ai/tenant-chat` : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ai/chat`;
      const body = tenantContext
        ? { message: userMsg, tenantContext }
        : { message: userMsg };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'bot', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: data.message || 'Xin lỗi, đã có lỗi xảy ra.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '💤 Lỗi kết nối. Vui lòng thử lại.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasContext = !!tenantContext;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{
            width: '380px', height: '560px',
            background: 'rgba(20, 20, 30, 0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: '20px',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Chat Header */}
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(59,130,246,0.3))', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.3px' }}>
                    {hasContext ? 'Trợ lý cá nhân' : 'RentBot AI'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
                    {hasContext && tenantContext?.contract ? `Phòng ${tenantContext.contract.roomNumber} • Đang thuê` : 'Trực tuyến • Tư vấn thuê phòng'}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '1.1rem', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                {msg.role === 'bot' && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'white', flexShrink: 0 }}>
                    <Bot size={14} />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: '16px',
                    borderBottomLeftRadius: msg.role === 'bot' ? '4px' : '16px',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #a855f7, #3b82f6)' : 'rgba(255,255,255,0.06)',
                    color: 'white',
                    fontSize: '0.88rem',
                    lineHeight: '1.5',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.text.replace(/\*\*(.*?)\*\*/g, '')}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'white' }}><Bot size={14} /></div>
                <div style={{ padding: '10px 14px', borderRadius: '16px', borderBottomLeftRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'pulse 1s infinite' }}></span>
                    <span style={{ width: '6px', height: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></span>
                    <span style={{ width: '6px', height: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && hasContext && (
            <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  style={{ padding: '5px 11px', borderRadius: '999px', fontSize: '0.72rem', cursor: 'pointer', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.12)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '8px', flexShrink: 0 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={hasContext ? "Hỏi về hóa đơn, hợp đồng..." : "Hỏi tôi bất kỳ điều gì..."}
              disabled={isLoading}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '0.82rem', outline: 'none' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '1rem', opacity: (!input.trim() || isLoading) ? 0.4 : 1, transition: 'opacity 0.2s' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          width: '58px', height: '58px', borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', color: 'white',
          boxShadow: '0 8px 30px rgba(168,85,247,0.5)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(168,85,247,0.7)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(168,85,247,0.5)'; }}
        title={isOpen ? 'Đóng chat' : 'Chat với RentBot AI'}
      >
        {isOpen ? <X size={24} /> : <Bot size={28} />}
      </button>
    </div>
  );
}
