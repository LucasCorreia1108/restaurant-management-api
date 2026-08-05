import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { TablesService } from '../tables/tables.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { AuthUser } from '../common/decorators';
import { OrderStatus, TableStatus } from '../common/enums';

@Injectable()
export class KitchenService {
  private readonly logger = new Logger(KitchenService.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly tablesService: TablesService,
    private readonly prisma: PrismaService,
    private readonly ws: WebsocketGateway,
  ) {}

  /** Kitchen queue: orders waiting or being prepared */
  getQueue() {
    return this.ordersService.findAll().then((orders) =>
      orders.filter((o) =>
        [
          OrderStatus.SENT_TO_KITCHEN,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ].includes(o.status as OrderStatus),
      ),
    );
  }

  /** RN007 - Only kitchen can set PREPARING */
  async startPreparing(orderId: string, user: AuthUser, notes?: string) {
    const order = await this.ordersService.findOne(orderId);

    if (
      order.status !== OrderStatus.SENT_TO_KITCHEN &&
      order.status !== OrderStatus.PREPARING
    ) {
      throw new BadRequestException(
        'Order must be SENT_TO_KITCHEN to start preparing (RN007)',
      );
    }

    if (order.status === OrderStatus.PREPARING) {
      return order;
    }

    const updated = await this.ordersService.changeStatus(
      orderId,
      OrderStatus.PREPARING,
      user.id,
      notes ?? 'Kitchen started preparation',
    );

    this.logger.log(`Kitchen started preparing order ${orderId}`);
    this.ws.emitOrderPreparing(updated);
    return updated;
  }

  /** RN007 - Only kitchen can set READY */
  async markReady(orderId: string, user: AuthUser, notes?: string) {
    const order = await this.ordersService.findOne(orderId);

    if (order.status !== OrderStatus.PREPARING) {
      throw new BadRequestException(
        'Order must be PREPARING to mark as READY (RN007)',
      );
    }

    const updated = await this.ordersService.changeStatus(
      orderId,
      OrderStatus.READY,
      user.id,
      notes ?? 'Order ready for delivery',
    );

    const stillCooking = await this.prisma.order.count({
      where: {
        tableId: order.tableId,
        status: {
          in: [OrderStatus.SENT_TO_KITCHEN, OrderStatus.PREPARING],
        },
      },
    });

    if (stillCooking === 0) {
      await this.tablesService.setStatus(order.tableId, TableStatus.OCCUPIED);
    } else {
      this.ws.emitTableUpdated(
        await this.tablesService.findOne(order.tableId),
      );
    }

    this.logger.log(`Order ${orderId} is ready`);
    this.ws.emitOrderReady(updated);
    return updated;
  }
}
