import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTableDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  number: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  capacity: number;
}

export class UpdateTableDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  number?: number;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class OpenTableDto {
  @ApiPropertyOptional({
    description:
      'Waiter responsible for the table (RN001). Required for ADMIN; WAITER uses own id.',
  })
  @IsOptional()
  @IsUUID()
  waiterId?: string;
}
