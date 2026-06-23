import { Injectable, Logger } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extractMeterReading(imageBuffer: Buffer): Promise<{ reading: number | null, text: string }> {
    this.logger.log('Bắt đầu quét ảnh để lấy số đồng hồ...');
    try {
      const result = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: (m) => this.logger.debug(m.status),
      });

      const text = result.data.text;
      
      // Sử dụng Regex để tìm các con số (VD: 01234, 123.4)
      const numberMatches = text.match(/\d+([.,]\d+)?/g);
      
      let reading = null;
      if (numberMatches && numberMatches.length > 0) {
        // Lấy con số lớn nhất tìm thấy (thường là số mét)
        const numbers = numberMatches.map(n => parseFloat(n.replace(',', '.')));
        reading = Math.max(...numbers);
      }

      this.logger.log(`Quét hoàn tất, lấy được số: ${reading}`);
      
      return { reading, text };
    } catch (error) {
      this.logger.error('Lỗi khi quét OCR', error);
      throw error;
    }
  }
}
