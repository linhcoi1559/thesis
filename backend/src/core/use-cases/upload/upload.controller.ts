import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Vui lòng chọn ảnh để upload');

    const result = await this.uploadService.uploadImage(file);
    return {
      message: 'Upload thành công',
      url: result.secure_url,
    };
  }
}
