import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class KitchenStatusDto {
  @ApiPropertyOptional({ example: 'Iniciando preparo' })
  @IsOptional()
  @IsString()
  notes?: string;
}
