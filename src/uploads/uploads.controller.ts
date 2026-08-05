import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Roles } from '../common/decorators';
import { Role } from '../common/enums';
import { UploadsService } from './uploads.service';
import { UploadImageResponseDto } from './dto/upload-response.dto';

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('menu-item')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Upload menu item image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpg, jpeg, png, webp — max 5MB)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: UploadImageResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadMenuItemImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadMenuItemImage(file);
  }
}
