import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { TablesService } from '../tables/tables.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreatePaymentDto, PayTableDto } from './dto/payment.dto';
import { AuthUser } from '../common/decorators';
import { OrderStatus, TableStatus } from '../common/enums';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly tablesService: TablesService,
    private readonly ws: WebsocketGateway,
  ) {}

  /** RN008 - Cashier only (enforced by RolesGuard on controller) */
  async payOrder(dto: CreatePaymentDto, user: AuthUser) {
    const order = await this.ordersService.findOne(dto.orderId);

    if (order.status === OrderStatus.CLOSED) {
      throw new BadRequestException('Order is already closed');
    }

    if (
      order.status !== OrderStatus.DELIVERED &&
      order.status !== OrderStatus.READY
    ) {
      throw new BadRequestException(
        'Order must be READY or DELIVERED before payment (RN004)',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId: dto.orderId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
        },
      });

      await tx.order.update({
        where: { id: dto.orderId },
        data: {
          status: OrderStatus.CLOSED,
          statusHistory: {
            create: {
              fromStatus: order.status,
              toStatus: OrderStatus.CLOSED,
              changedBy: user.id,
              notes: `Payment via ${dto.paymentMethod}`,
            },
          },
        },
      });

      return payment;
    });

    const closedOrder = await this.ordersService.findOne(dto.orderId);
    this.ws.emitOrderClosed(closedOrder);
    this.ws.emitPaymentCompleted(result);

    const openOrders = await this.prisma.order.count({
      where: {
        tableId: order.tableId,
        status: { not: OrderStatus.CLOSED },
      },
    });

    if (openOrders === 0) {
      // RN006
      await this.tablesService.release(order.tableId);
    }

    this.logger.log(`Payment completed for order ${dto.orderId}`);
    return { payment: result, order: closedOrder };
  }

  /** Close all payable orders for a table and release it (RN004/RN006/RN008) */
  async payTable(dto: PayTableDto, user: AuthUser) {
    const table = await this.tablesService.findOne(dto.tableId);

    const pendingKitchen = await this.prisma.order.count({
      where: {
        tableId: dto.tableId,
        status: {
          in: [
            OrderStatus.CREATED,
            OrderStatus.SENT_TO_KITCHEN,
            OrderStatus.PREPARING,
          ],
        },
      },
    });

    if (pendingKitchen > 0) {
      throw new BadRequestException(
        'Cannot close bill with pending kitchen orders (RN004)',
      );
    }

    const payableOrders = await this.prisma.order.findMany({
      where: {
        tableId: dto.tableId,
        status: {
          in: [OrderStatus.READY, OrderStatus.DELIVERED],
        },
      },
    });

    if (payableOrders.length === 0) {
      throw new BadRequestException('No payable orders for this table');
    }

    const total = payableOrders.reduce(
      (sum, o) => sum.add(o.total),
      new Prisma.Decimal(0),
    );

    const amount = dto.amount ?? Number(total);

    const payments = await this.prisma.$transaction(async (tx) => {
      const created = [];

      for (const order of payableOrders) {
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            amount: order.total,
            paymentMethod: dto.paymentMethod,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CLOSED,
            statusHistory: {
              create: {
                fromStatus: order.status,
                toStatus: OrderStatus.CLOSED,
                changedBy: user.id,
                notes: `Table payment via ${dto.paymentMethod}`,
              },
            },
          },
        });

        created.push(payment);
      }

      await tx.table.update({
        where: { id: dto.tableId },
        data: {
          status: TableStatus.FREE,
          currentWaiterId: null,
          openedAt: null,
        },
      });

      return created;
    });

    for (const order of payableOrders) {
      const closed = await this.ordersService.findOne(order.id);
      this.ws.emitOrderClosed(closed);
    }

    this.ws.emitPaymentCompleted({
      tableId: dto.tableId,
      amount,
      paymentMethod: dto.paymentMethod,
      payments,
    });

    const releasedTable = await this.tablesService.findOne(dto.tableId);
    this.ws.emitTableUpdated(releasedTable);

    this.logger.log(
      `Table ${table.number} paid and released. Total: ${amount}`,
    );

    return {
      table: releasedTable,
      amount,
      paymentMethod: dto.paymentMethod,
      payments,
      waiter: table.currentWaiter,
    };
  }

  async findByOrder(orderId: string) {
    await this.ordersService.findOne(orderId);
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { paidAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            table: true,
            waiter: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return payment;
  }

  async getTableBill(tableId: string) {
    const table = await this.tablesService.findOne(tableId);
    const orders = await this.prisma.order.findMany({
      where: {
        tableId,
        status: { not: OrderStatus.CLOSED },
      },
      include: {
        items: { include: { menuItem: true } },
        waiter: { select: { id: true, name: true, email: true } },
      },
    });

    const total = orders.reduce(
      (sum, o) => sum.add(o.total),
      new Prisma.Decimal(0),
    );

    return {
      table,
      waiter: table.currentWaiter,
      orders,
      total,
    };
  }
}
