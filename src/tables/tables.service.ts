import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { Role, TableStatus } from '../common/enums';

const tableInclude = {
  currentWaiter: {
    select: { id: true, name: true, email: true, role: true },
  },
} as const;

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ws: WebsocketGateway,
  ) {}

  async create(dto: CreateTableDto) {
    const existing = await this.prisma.table.findUnique({
      where: { number: dto.number },
    });
    if (existing) {
      throw new ConflictException(`Table number ${dto.number} already exists`);
    }

    return this.prisma.table.create({
      data: {
        number: dto.number,
        capacity: dto.capacity,
        status: TableStatus.FREE,
      },
      include: tableInclude,
    });
  }

  async findAll() {
    return this.prisma.table.findMany({
      include: tableInclude,
      orderBy: { number: 'asc' },
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        ...tableInclude,
        orders: {
          where: { status: { not: 'CLOSED' } },
          include: {
            items: { include: { menuItem: true } },
            waiter: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException(`Table ${id} not found`);
    }

    return table;
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findOne(id);

    if (dto.number !== undefined) {
      const existing = await this.prisma.table.findUnique({
        where: { number: dto.number },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Table number ${dto.number} already exists`);
      }
    }

    const table = await this.prisma.table.update({
      where: { id },
      data: dto,
      include: tableInclude,
    });

    this.ws.emitTableUpdated(table);
    return table;
  }

  async remove(id: string) {
    const table = await this.findOne(id);
    if (table.status !== TableStatus.FREE && table.status !== TableStatus.CLOSED) {
      throw new BadRequestException('Cannot delete an occupied table');
    }
    await this.prisma.table.delete({ where: { id } });
    return { message: `Table ${id} deleted successfully` };
  }

  /** RN001 - Every occupied table must have a responsible waiter */
  async open(id: string, dto: { waiterId: string }) {
    const table = await this.findOne(id);

    if (table.status !== TableStatus.FREE && table.status !== TableStatus.CLOSED) {
      throw new BadRequestException('Table is not available to open');
    }

    const waiter = await this.prisma.user.findUnique({
      where: { id: dto.waiterId },
    });

    if (!waiter || waiter.role !== Role.WAITER) {
      throw new BadRequestException('A valid waiter is required (RN001)');
    }

    const updated = await this.prisma.table.update({
      where: { id },
      data: {
        status: TableStatus.OCCUPIED,
        currentWaiterId: dto.waiterId,
        openedAt: new Date(),
      },
      include: tableInclude,
    });

    this.logger.log(`Table ${table.number} opened by waiter ${waiter.name}`);
    this.ws.emitTableUpdated(updated);
    return updated;
  }

  async requestBill(id: string) {
    const table = await this.findOne(id);

    if (table.status === TableStatus.FREE || table.status === TableStatus.CLOSED) {
      throw new BadRequestException('Table has no open session');
    }

    const pendingOrders = await this.prisma.order.count({
      where: {
        tableId: id,
        status: {
          in: ['CREATED', 'SENT_TO_KITCHEN', 'PREPARING', 'READY'],
        },
      },
    });

    if (pendingOrders > 0) {
      throw new BadRequestException(
        'Cannot request bill while there are pending kitchen orders (RN004)',
      );
    }

    const updated = await this.prisma.table.update({
      where: { id },
      data: { status: TableStatus.WAITING_PAYMENT },
      include: tableInclude,
    });

    this.ws.emitTableUpdated(updated);
    return updated;
  }

  async setStatus(id: string, status: TableStatus) {
    const updated = await this.prisma.table.update({
      where: { id },
      data: { status },
      include: tableInclude,
    });
    this.ws.emitTableUpdated(updated);
    return updated;
  }

  /** RN006 - After payment, table returns to FREE */
  async release(id: string) {
    const updated = await this.prisma.table.update({
      where: { id },
      data: {
        status: TableStatus.FREE,
        currentWaiterId: null,
        openedAt: null,
      },
      include: tableInclude,
    });
    this.ws.emitTableUpdated(updated);
    return updated;
  }
}
