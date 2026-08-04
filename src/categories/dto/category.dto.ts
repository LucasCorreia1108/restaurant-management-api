import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CategoryType } from '../../common/enums';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Entradas' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.STARTER })
  @IsEnum(CategoryType)
  type: CategoryType;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Entradas Frias' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ enum: CategoryType })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;
}
