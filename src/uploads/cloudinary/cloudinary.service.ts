import {
  BadGatewayException,
  Injectable,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
    this.logger.log('Cloudinary configured');
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'restaurant/menu-items',
  ): Promise<CloudinaryUploadResult> {
    let result: UploadApiResponse;
    try {
      result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
          },
          (error, uploaded) => {
            if (error || !uploaded) {
              const statusCode =
                error && typeof error === 'object' && 'http_code' in error
                  ? Number(error.http_code)
                  : undefined;
              if (statusCode === 403) {
                reject(
                  new Error(
                    'Cloudinary recusou o upload.',
                  ),
                );
                return;
              }
              const message =
                error && typeof error === 'object' && 'message' in error
                  ? String(error.message)
                  : 'Cloudinary upload failed';
              reject(new Error(message));
              return;
            }
            resolve(uploaded);
          },
        );

        Readable.from(file.buffer).pipe(stream);
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Cloudinary upload failed';
      this.logger.error(`Image upload failed: ${message}`);
      throw new BadGatewayException(
        `Não foi possível enviar a imagem: ${message}`,
      );
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
    this.logger.log(`Deleted Cloudinary asset ${publicId}`);
  }

  extractPublicId(imageUrl: string): string | null {
    try {
      const match = imageUrl.match(
        /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/,
      );
      return match?.[1] ?? null;
    } catch {
      return null;
    }
  }
}
