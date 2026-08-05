import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/v1/restaurant/menu-items/file.jpg',
  })
  url: string;

  @ApiProperty({ example: 'restaurant/menu-items/file' })
  publicId: string;
}
