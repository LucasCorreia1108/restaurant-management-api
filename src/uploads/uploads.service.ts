import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CloudinaryService } from './cloudinary/cloudinary.service';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly cloudinary: CloudinaryService) {}

  async uploadMenuItemImage(file?: Express.Multer.File) {
    this.validateFile(file);

    const uploaded = await this.cloudinary.uploadImage(file!);
    this.logger.log(`Menu item image uploaded: ${uploaded.publicId}`);

    return {
      url: uploaded.url,
      publicId: uploaded.publicId,
    };
  }

  private validateFile(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required (field name: file)');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: jpg, jpeg, png, webp',
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File too large. Maximum size is 5MB');
    }
  }
}
