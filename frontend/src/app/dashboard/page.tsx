"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Home, Users, FileText, Bell, Settings, LogOut, Search, TrendingUp, AlertCircle, CheckCircle2, MessageSquareText, X, Sparkles
} from 'lucide-react';

// Mock Data
const revenueData = [
  { name: 'T1', current: 40000000, expected: 45000000 },
  { name: 'T2', current: 45000000, expected: 45000000 },
  { name: 'T3', current: 35000000, expected: 45000000 },
  { name: 'T4', current: 50000000, expected: 50000000 },
  { name: 'T5', current: 48000000, expected: 50000000 },
  { name: 'T6', current: 52000000, expected: 55000000 },
];

const roomStatusData = [
  { name: 'Đang Thuê', value: 25 },
  { name: 'Trống', value: 5 },
  { name: 'Bảo Trì', value: 2 },
];

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAiSubmit = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    try {
      // In real scenario, make API call here with Authorization token
      const res = await fetch('http://localhost:3000/ai/generate-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer fake-token` },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      setAiResponse(data.text || 'AI không thể trả lời lúc này.');
    } catch (err) {
      setAiResponse('Lỗi kết nối AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isClient) return null; // Avoid hydration mismatch for Recharts

  return (
    <div className="flex h-screen bg-[#0B0A10] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#16141f] p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl">
            S
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            SaaS Rent
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
            <Home size={20} /> Tổng Quan
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            <FileText size={20} /> Hợp Đồng
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            <Users size={20} /> Khách Thuê
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors relative">
            <AlertCircle size={20} /> Báo Cáo Sự Cố
            <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">3</span>
          </a>
        </nav>

        <div className="pt-6 border-t border-white/10 mt-auto">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            <Settings size={20} /> Cài Đặt
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors mt-2">
            <LogOut size={20} /> Đăng Xuất
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-20 border-b border-white/10 bg-[#16141f]/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm phòng, khách thuê..." 
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell size={24} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#16141f]"></span>
            </button>
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
              <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-10 h-10 rounded-full border border-white/20" />
              <div>
                <p className="text-sm font-medium">Nguyễn Văn A</p>
                <p className="text-xs text-gray-400">Chủ Trọ</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold mb-1">Thống Kê Tháng Này</h2>
              <p className="text-gray-400 text-sm">Cập nhật lần cuối: Hôm nay lúc 08:30</p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <FileText size={16} /> Xuất Báo Cáo
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#16141f] rounded-xl p-6 border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors"></div>
              <p className="text-gray-400 text-sm mb-1">Tổng Doanh Thu</p>
              <h3 className="text-2xl font-bold">52.000.000đ</h3>
              <p className="text-emerald-400 text-xs flex items-center gap-1 mt-2">
                <TrendingUp size={14} /> +12% so với tháng trước
              </p>
            </div>
            
            <div className="bg-[#16141f] rounded-xl p-6 border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
              <p className="text-gray-400 text-sm mb-1">Tỷ Lệ Lấp Đầy</p>
              <h3 className="text-2xl font-bold">83%</h3>
              <p className="text-emerald-400 text-xs flex items-center gap-1 mt-2">
                25/32 Phòng đang cho thuê
              </p>
            </div>

            <div className="bg-[#16141f] rounded-xl p-6 border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-colors"></div>
              <p className="text-gray-400 text-sm mb-1">Hóa Đơn Chưa Thu</p>
              <h3 className="text-2xl font-bold">15.500.000đ</h3>
              <p className="text-amber-400 text-xs flex items-center gap-1 mt-2">
                <AlertCircle size={14} /> 5 Khách chưa thanh toán
              </p>
            </div>

            <div className="bg-[#16141f] rounded-xl p-6 border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-colors"></div>
              <p className="text-gray-400 text-sm mb-1">Sự Cố Đang Chờ</p>
              <h3 className="text-2xl font-bold text-red-400">3 Vụ</h3>
              <p className="text-red-400 text-xs flex items-center gap-1 mt-2">
                Cần xử lý gấp
              </p>
            </div>
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#16141f] rounded-xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold mb-6">Doanh Thu 6 Tháng Gần Nhất</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000000}M`} />
                    <Tooltip 
                      cursor={{fill: '#ffffff05'}}
                      contentStyle={{ backgroundColor: '#0B0A10', borderColor: '#ffffff20', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="current" name="Đã Thu" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="expected" name="Dự Kiến" fill="#a855f7" opacity={0.5} radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#16141f] rounded-xl p-6 border border-white/5 flex flex-col">
              <h3 className="text-lg font-semibold mb-6">Trạng Thái Phòng</h3>
              <div className="h-64 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roomStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {roomStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0B0A10', borderColor: '#ffffff20', borderRadius: '8px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Button */}
      <button 
        onClick={() => setIsAiOpen(true)}
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-1 ${isAiOpen ? 'scale-0' : 'scale-100'}`}
      >
        <Sparkles size={24} />
      </button>

      {/* AI Chat Window */}
      <div className={`fixed bottom-8 right-8 w-96 bg-[#16141f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all origin-bottom-right duration-300 ${isAiOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Sparkles size={18} />
            <span>Trợ lý ảo AI (Gemini)</span>
          </div>
          <button onClick={() => setIsAiOpen(false)} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1 h-64 overflow-y-auto bg-black/20 flex flex-col gap-3 text-sm">
          <div className="bg-white/5 rounded-xl rounded-tl-none p-3 self-start max-w-[85%] text-gray-200">
            Chào chủ trọ! Tôi có thể viết thông báo, nhắc nợ, hay hợp đồng giúp bạn. Bạn cần gì?
          </div>
          {aiResponse && (
            <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl rounded-tr-none p-3 self-end max-w-[95%] text-white relative">
              <Sparkles size={14} className="absolute -top-2 -left-2 text-indigo-400" />
              <div className="whitespace-pre-wrap">{aiResponse}</div>
            </div>
          )}
          {isAiLoading && (
            <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl rounded-tr-none p-3 self-end max-w-[85%] text-indigo-200 animate-pulse">
              Đang suy nghĩ...
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/10 flex gap-2">
          <input 
            type="text" 
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()}
            placeholder="VD: Viết nhắc nợ tiền phòng lịch sự..." 
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button 
            onClick={handleAiSubmit}
            disabled={isAiLoading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
          >
            <MessageSquareText size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
