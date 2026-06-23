import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private readonly ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'fake-key' });

  async generateNotice(prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Bạn là trợ lý cho một chủ trọ. Chủ trọ yêu cầu: "${prompt}". Hãy viết một thông báo gửi cho khách thuê một cách lịch sự, trang trọng, ngắn gọn.`,
      });
      return response.text;
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Không thể gọi AI lúc này');
    }
  }
}
