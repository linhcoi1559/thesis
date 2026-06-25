import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../../presentation/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-notice')
  @UseGuards(JwtAuthGuard)
  async generateNotice(@Body('prompt') prompt: string) {
    if (!prompt) return { text: '' };
    const text = await this.aiService.generateNotice(prompt);
    return { text };
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Body('message') message: string) {
    if (!message) return { text: 'Xin chào, tôi có thể giúp gì cho bạn?' };
    const text = await this.aiService.chat(message);
    return { text };
  }

  // Endpoint công khai - không cần JWT, dành cho trang chủ
  @Post('public-chat')
  async publicChat(@Body('message') message: string) {
    if (!message) {
      return { text: 'Xin chào! 👋 Tôi là RentBot. Tôi có thể tư vấn về phòng trọ, giá cả và thời gian thuê phù hợp nhất cho bạn!' };
    }
    const text = await this.aiService.publicRoomChat(message);
    return { text };
  }

  // Endpoint có context cá nhân - dành cho khách thuê đã đăng nhập
  @Post('tenant-chat')
  @UseGuards(JwtAuthGuard)
  async tenantChat(
    @Body('message') message: string,
    @Body('tenantContext') tenantContext: any,
  ) {
    if (!message) return { text: 'Xin chào! Tôi có thể giúp gì cho bạn?' };
    const text = await this.aiService.tenantContextChat(message, tenantContext || {});
    return { text };
  }
}
