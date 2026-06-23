import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  providers: [UploadService, CloudinaryProvider],
  controllers: [UploadController],
  exports: [UploadService, CloudinaryProvider],
})
export class UploadModule {}
