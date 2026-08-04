import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PayTableDto } from './dto/payment.dto';
import { Roles, CurrentUser } from '../common/decorators';
import type { AuthUser } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('table/:tableId/bill')
  @Roles(Role.CASHIER, Role.ADMIN, Role.WAITER)
  @ApiOperation({
    summary: 'Get table bill with waiter info (Cashier view)',
  })
  getTableBill(@Param('tableId', ParseUUIDPipe) tableId: string) {
    return this.paymentsService.getTableBill(tableId);
  }

  @Post('order')
  @Roles(Role.CASHIER, Role.ADMIN)
  @ApiOperation({ summary: 'Register payment for a single order (RN008)' })
  payOrder(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    return this.paymentsService.payOrder(dto, user);
  }

  @Post('table')
  @Roles(Role.CASHIER, Role.ADMIN)
  @ApiOperation({
    summary: 'Close table bill, register payment and free table (RN004/RN006/RN008)',
  })
  payTable(@Body() dto: PayTableDto, @CurrentUser() user: AuthUser) {
    return this.paymentsService.payTable(dto, user);
  }

  @Get('order/:orderId')
  @Roles(Role.CASHIER, Role.ADMIN)
  @ApiOperation({ summary: 'List payments for an order' })
  findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }

  @Get(':id')
  @Roles(Role.CASHIER, Role.ADMIN)
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }
}
