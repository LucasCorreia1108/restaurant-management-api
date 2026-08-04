import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../../common/enums';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order to pay' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 150.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.PIX })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class PayTableDto {
  @ApiProperty({ description: 'Table whose open orders will be closed' })
  @IsUUID()
  @IsNotEmpty()
  tableId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CREDIT_CARD })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Optional override amount; defaults to sum of delivered orders',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;
}
