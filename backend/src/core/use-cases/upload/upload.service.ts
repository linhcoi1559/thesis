import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class UploadService {
  async uploadImage(file: Express.Multer.File): Promise<any> {
    try {
      const base64Image = file.buffer.toString('base64');
      
      const formData = new URLSearchParams();
      formData.append('image', base64Image);

      // Using a free ImgBB API key to ensure it works without .env setup
      const response = await fetch('https://api.imgbb.com/1/upload?key=6e30bc7e81df6f1c480a56653ea956cf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new BadRequestException('Upload ảnh thất bại');
      }

      return { secure_url: data.data.url };
    } catch (error) {
      console.error('Upload Error:', error);
      throw new BadRequestException('Lỗi tải ảnh lên server');
    }
  }
}
