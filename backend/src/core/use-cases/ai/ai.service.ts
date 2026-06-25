import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6JfsmB_P54wsrCRV4LEMMKMnwQmoUM4LV7lvmzZU_JKdQ' });

  constructor(private readonly prisma: PrismaService) {}

  async generateNotice(prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: `Bạn là trợ lý cho một chủ trọ. Chủ trọ yêu cầu: "${prompt}". Hãy viết một thông báo gửi cho khách thuê một cách lịch sự, trang trọng, ngắn gọn.`,
      });
      return response.text;
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Không thể gọi AI lúc này');
    }
  }

  async chat(message: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: `Bạn là trợ lý AI tên là SaaS Rent Assistant, giúp đỡ khách thuê phòng trọ. Khách thuê hỏi: "${message}". Hãy trả lời ngắn gọn, lịch sự và hữu ích.`,
      });
      return response.text;
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || '';
      if (errMsg.includes('503') || errMsg.includes('high demand')) {
        throw new BadRequestException('Hệ thống AI của Google hiện đang quá tải. Vui lòng thử lại sau ít phút.');
      }
      throw new BadRequestException('Không thể gọi AI lúc này. Lỗi: ' + errMsg);
    }
  }

  async publicRoomChat(message: string): Promise<string> {
    try {
      // Lấy thông tin phòng thực từ DB
      const rooms = await this.prisma.room.findMany({
        orderBy: { roomNumber: 'asc' },
      });

      const roomContext = rooms.map(r => {
        const statusVi =
          r.status === 'VACANT' ? '✅ Còn trống' :
          r.status === 'OCCUPIED' ? '❌ Đã có người thuê' :
          '🔧 Đang bảo trì';
        return `- Phòng ${r.roomNumber}: ${Number(r.price).toLocaleString('vi-VN')}đ/tháng | ${statusVi}${r.description ? ` | ${r.description}` : ''}`;
      }).join('\n');

      const systemPrompt = `Bạn là RentBot - trợ lý AI thông minh của nhà trọ Smart Boarding House.
Nhiệm vụ: tư vấn cho khách hàng đang tìm phòng thuê, trả lời ngắn gọn và hữu ích bằng tiếng Việt.

THÔNG TIN PHÒNG HIỆN TẠI:
${roomContext}

NGUYÊN TẮC:
- Gợi ý phòng phù hợp dựa trên nhu cầu (sinh viên, gia đình, ngân sách)
- Thời gian thuê: tối thiểu 6 tháng, lý tưởng 1 năm để ổn định
- Nếu muốn đặt phòng: hướng dẫn điền form "Đăng Ký Tư Vấn" ở phía dưới trang
- Chỉ nói về thông tin có trong dữ liệu phòng, không bịa thêm

Khách hỏi: "${message}"`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: systemPrompt,
      });
      return response.text;
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || '';
      if (errMsg.includes('503') || errMsg.includes('high demand')) {
        throw new BadRequestException('Hệ thống AI đang quá tải. Vui lòng thử lại sau ít phút.');
      }
      throw new BadRequestException('Không thể gọi AI lúc này. Lỗi: ' + errMsg);
    }
  }

  async tenantContextChat(message: string, ctx: any): Promise<string> {
    try {
      const fmt = (n: any) => Number(n).toLocaleString('vi-VN');
      const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

      const contractSection = ctx.contract
        ? `\nHỢP ĐỒNG HIỆN TẠI:\n- Phòng: ${ctx.contract.roomNumber || 'N/A'}\n- Thời hạn: ${fmtDate(ctx.contract.startDate)} → ${fmtDate(ctx.contract.endDate)}\n- Tiền phòng: ${fmt(ctx.contract.rentalPrice)}đ/tháng\n- Giá điện: ${fmt(ctx.contract.electricityPrice || 3000)}đ/kWh\n- Giá nước: ${fmt(ctx.contract.waterPrice || 150000)}đ/tháng\n- Số thành viên: ${ctx.contract.memberCount || 1} người`
        : '\nHỢP ĐỒNG: Chưa có hợp đồng đang hoạt động.';

      const unpaid = (ctx.invoices || []).filter((i: any) => i.status === 'UNPAID' || i.status === 'OVERDUE');
      const paidTotal = (ctx.invoices || []).filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + Number(i.amount), 0);
      const unpaidTotal = unpaid.reduce((s: number, i: any) => s + Number(i.amount), 0);
      const nextDue = unpaid.length > 0 ? [...unpaid].sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] : null;

      const invoiceSection = `\nHÓA ĐƠN:\n- Đã thanh toán: ${fmt(paidTotal)}đ (${(ctx.invoices || []).filter((i: any) => i.status === 'PAID').length} kỳ)\n- Còn nợ: ${fmt(unpaidTotal)}đ (${unpaid.length} hóa đơn chưa đóng)${nextDue ? `\n- Hóa đơn gần nhất cần đóng: ${fmt(nextDue.amount)}đ | Hạn: ${fmtDate(nextDue.dueDate)} | ${nextDue.status === 'OVERDUE' ? '⚠️ QUÁ HẠN' : '📋 Chưa thanh toán'}` : '\n- Không có hóa đơn nào đang chờ.'}`;

      const activeViol = (ctx.violations || []).filter((v: any) => v.status !== 'RESOLVED');
      const violSection = activeViol.length > 0
        ? `\nVI PHẠM ĐANG MỞ (${activeViol.length}):\n${activeViol.map((v: any) => `- ${v.description}`).join('\n')}`
        : '';

      const activeInc = (ctx.incidents || []).filter((i: any) => i.status !== 'RESOLVED');
      const incSection = activeInc.length > 0
        ? `\nSỰ CỐ ĐANG XỬ LÝ (${activeInc.length}):\n${activeInc.map((i: any) => `- [${i.title}] ${i.description}`).join('\n')}`
        : '\nSỰ CỐ: Không có sự cố nào đang xử lý.';

      const today = new Date().toLocaleDateString('vi-VN');
      const prompt = `Bạn là trợ lý AI cá nhân của khách thuê ${ctx.tenantName || 'Quý khách'} tại nhà trọ Smart Boarding House.
Dưới đây là thông tin CÁ NHÂN của khách thuê này:
${contractSection}
${invoiceSection}
${violSection}
${incSection}

NGUYÊN TẮC TRẢ LỜI:
- Trả lời ngắn gọn, thân thiện, bằng tiếng Việt, xưng hô "bạn"
- Dùng dữ liệu thực ở trên để trả lời chính xác
- Nếu hóa đơn quá hạn: nhắc nhở thanh toán gấp
- Nếu hỏi về hợp đồng: tính số ngày còn lại so với hôm nay (${today})
- Nếu hỏi làm sao báo sự cố: hướng dẫn dùng nút "+ Báo cáo mới" trên trang
- Không bịa thêm thông tin không có trong dữ liệu

Khách thuê hỏi: "${message}"`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
      });
      return response.text;
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || '';
      if (errMsg.includes('503') || errMsg.includes('high demand')) {
        throw new BadRequestException('Hệ thống AI đang quá tải. Vui lòng thử lại sau ít phút.');
      }
      throw new BadRequestException('Không thể gọi AI lúc này. Lỗi: ' + errMsg);
    }
  }
}
