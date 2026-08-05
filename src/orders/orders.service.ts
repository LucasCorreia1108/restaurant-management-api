import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma, OrderStatus as PrismaOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TablesService } from '../tables/tables.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreateOrderDto } from './dto/order.dto';
import { AuthUser } from '../common/decorators';
import { OrderStatus, Role, TableStatus } from '../common/enums';

const orderInclude = {
  items: {
    include: {
      menuItem: {
        include: { category: true },
      },
    },
  },
  table: true,
  waiter: {
    select: { id: true, name: true, email: true },
  },
  statusHistory: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  },
  payments: true,
} as const;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tablesService: TablesService,
    private readonly ws: WebsocketGateway,
  ) {}

  async create(dto: CreateOrderDto, user: AuthUser) {
    const table = await this.tablesService.findOne(dto.tableId);

    if (table.status === TableStatus.FREE || table.status === TableStatus.CLOSED) {
      throw new BadRequestException('Table must be opened before creating orders');
    }

    // RN001 / RN003
    const waiterId =
      user.role === Role.WAITER ? user.id : table.currentWaiterId;

    if (!waiterId) {
      throw new BadRequestException(
        'Table must have a responsible waiter (RN001/RN003)',
      );
    }

    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, available: true },
    });

    if (menuItems.length !== new Set(menuItemIds).size) {
      throw new BadRequestException(
        'One or more menu items are unavailable or not found',
      );
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));
    let total = new Prisma.Decimal(0);

    const itemsData = dto.items.map((item) => {
      const unitPrice = priceMap.get(item.menuItemId)!;
      total = total.add(unitPrice.mul(item.quantity));
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes,
        unitPrice,
      };
    });

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          tableId: dto.tableId,
          waiterId,
          status: OrderStatus.CREATED,
          total,
          items: { create: itemsData },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: OrderStatus.CREATED,
              changedBy: user.id,
              notes: 'Order created',
            },
          },
        },
        include: orderInclude,
      });

      await tx.table.update({
        where: { id: dto.tableId },
        data: { status: TableStatus.WAITING_ORDER },
      });

      return created;
    });

    this.logger.log(`Order ${order.id} created for table ${table.number}`);
    this.ws.emitOrderCreated(order);
    this.ws.emitTableUpdated(
      await this.tablesService.findOne(dto.tableId),
    );

    return order;
  }

  findAll(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  findByTable(tableId: string) {
    return this.prisma.order.findMany({
      where: { tableId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendToKitchen(id: string, user: AuthUser, notes?: string) {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.CREATED) {
      throw new BadRequestException(
        'Only CREATED orders can be sent to kitchen',
      );
    }

    const updated = await this.changeStatus(
      order.id,
      OrderStatus.SENT_TO_KITCHEN,
      user.id,
      notes ?? 'Sent to kitchen',
    );

    await this.tablesService.setStatus(
      order.tableId,
      TableStatus.IN_PREPARATION,
    );

    this.ws.emitOrderSent(updated);
    return updated;
  }

  async markDelivered(id: string, user: AuthUser, notes?: string) {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException('Only READY orders can be delivered');
    }

    const updated = await this.changeStatus(
      order.id,
      OrderStatus.DELIVERED,
      user.id,
      notes ?? 'Delivered to table',
    );

    const pendingKitchen = await this.prisma.order.count({
      where: {
        tableId: order.tableId,
        status: {
          in: [
            OrderStatus.CREATED,
            OrderStatus.SENT_TO_KITCHEN,
            OrderStatus.PREPARING,
            OrderStatus.READY,
          ],
        },
      },
    });

    if (pendingKitchen === 0) {
      await this.tablesService.setStatus(order.tableId, TableStatus.OCCUPIED);
    } else {
      this.ws.emitTableUpdated(
        await this.tablesService.findOne(order.tableId),
      );
    }

    this.ws.emitOrderDelivered(updated);
    return updated;
  }

  /** RN005 - Full status change history */
  async changeStatus(
    orderId: string,
    toStatus: OrderStatus,
    changedBy: string,
    notes?: string,
  ) {
    const order = await this.findOne(orderId);
    const fromStatus = order.status as OrderStatus;

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: toStatus as PrismaOrderStatus,
        statusHistory: {
          create: {
            fromStatus: fromStatus as PrismaOrderStatus,
            toStatus: toStatus as PrismaOrderStatus,
            changedBy,
            notes,
          },
        },
      },
      include: orderInclude,
    });

    this.logger.log(
      `Order ${orderId} status: ${fromStatus} -> ${toStatus}`,
    );
    return updated;
  }
}
