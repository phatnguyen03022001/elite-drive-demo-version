import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    // Cấu hình Cloudinary trực tiếp trong constructor
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<string> {
    if (!file) throw new BadRequestException('File không hợp lệ');

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto', // Tự động nhận diện image/video/raw
        },
        (error, result: UploadApiResponse) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return reject(
              new InternalServerErrorException(
                'Không thể upload ảnh lên Cloudinary',
              ),
            );
          }
          // Trả về secure_url (https) từ Cloudinary
          resolve(result.secure_url);
        },
      );

      // Chuyển đổi Buffer từ Multer thành Stream để đẩy lên Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
