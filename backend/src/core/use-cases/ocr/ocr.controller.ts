import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('extract-meter')
  @UseInterceptors(FileInterceptor('image'))
  async extractMeter(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên một ảnh');
    }

    // Pass the image buffer to the OCR service
    const result = await this.ocrService.extractMeterReading(file.buffer);
    
    return {
      message: 'Trích xuất số thành công',
      data: result,
    };
  }
}
