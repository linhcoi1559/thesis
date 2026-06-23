import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../../presentation/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-notice')
  async generateNotice(@Body('prompt') prompt: string) {
    if (!prompt) return { text: '' };
    const text = await this.aiService.generateNotice(prompt);
    return { text };
  }
}
