import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { Roles, CurrentUser } from '../common/decorators';
import type { AuthUser } from '../common/decorators';
import { Role, OrderStatus } from '../common/enums';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.WAITER, Role.ADMIN)
  @ApiOperation({ summary: 'Create order for a table (RN002/RN003)' })
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
    return this.ordersService.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.WAITER, Role.KITCHEN, Role.CASHIER)
  @ApiOperation({ summary: 'List orders' })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  findAll(@Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(status);
  }

  @Get('table/:tableId')
  @Roles(Role.ADMIN, Role.WAITER, Role.CASHIER)
  @ApiOperation({ summary: 'List orders for a table' })
  findByTable(@Param('tableId', ParseUUIDPipe) tableId: string) {
    return this.ordersService.findByTable(tableId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.WAITER, Role.KITCHEN, Role.CASHIER)
  @ApiOperation({ summary: 'Get order details with history (RN005)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Post(':id/send-to-kitchen')
  @Roles(Role.WAITER, Role.ADMIN)
  @ApiOperation({ summary: 'Send order to kitchen' })
  sendToKitchen(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.sendToKitchen(id, user, dto.notes);
  }

  @Post(':id/deliver')
  @Roles(Role.WAITER, Role.ADMIN)
  @ApiOperation({ summary: 'Mark order as delivered' })
  deliver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.markDelivered(id, user, dto.notes);
  }
}
