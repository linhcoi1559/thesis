'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
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
        ? `Xin chào **${tenantContext.tenantName}**! 👋 Tôi là trợ lý AI cá nhân của bạn.\n\nTôi biết thông tin phòng, hóa đơn và hợp đồng của bạn — hãy hỏi tôi bất kỳ điều gì!`
        : 'Xin chào! Tôi là Trợ lý AI của nhà trọ. Tôi có thể giúp gì cho bạn?',
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
      // Dùng endpoint mới nếu có context, fallback về endpoint cũ
      const endpoint = tenantContext ? 'http://localhost:3000/ai/tenant-chat' : 'http://localhost:3000/ai/chat';
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
      setMessages(prev => [...prev, { role: 'bot', text: 'Xin lỗi, không thể kết nối tới máy chủ.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasContext = !!tenantContext;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105"
          title="Chat với Trợ lý AI"
        >
          <MessageSquare size={24} />
          {/* Pulse indicator nếu có context */}
          {hasContext && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <span className="font-medium block text-sm">
                  {hasContext ? `Trợ lý cá nhân` : 'SaaS Rent Assistant'}
                </span>
                {hasContext && tenantContext?.contract && (
                  <span className="text-indigo-200 text-xs">
                    Phòng {tenantContext.contract.roomNumber} • Đang thuê
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="p-4 h-72 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions - chỉ hiện lúc đầu */}
          {messages.length <= 1 && hasContext && (
            <div className="px-3 pb-2 pt-1 flex flex-wrap gap-1.5 bg-gray-50 border-t border-gray-100">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              placeholder={hasContext ? 'Hỏi về hóa đơn, hợp đồng...' : 'Nhập tin nhắn...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
