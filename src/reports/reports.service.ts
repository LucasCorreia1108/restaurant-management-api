import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../common/enums';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async salesSummary(from?: string, to?: string) {
    const dateFilter = this.buildDateFilter(from, to);

    const payments = await this.prisma.payment.findMany({
      where: dateFilter ? { paidAt: dateFilter } : undefined,
      include: {
        order: {
          include: {
            waiter: { select: { id: true, name: true } },
            table: { select: { id: true, number: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalRevenue = payments.reduce(
      (sum, p) => sum.add(p.amount),
      new Prisma.Decimal(0),
    );

    const byMethod: Record<string, Prisma.Decimal> = {};
    for (const payment of payments) {
      const key = payment.paymentMethod;
      byMethod[key] = (byMethod[key] ?? new Prisma.Decimal(0)).add(
        payment.amount,
      );
    }

    return {
      period: { from: from ?? null, to: to ?? null },
      totalPayments: payments.length,
      totalRevenue,
      byPaymentMethod: Object.fromEntries(
        Object.entries(byMethod).map(([k, v]) => [k, v]),
      ),
      payments,
    };
  }

  async ordersByStatus(from?: string, to?: string) {
    const dateFilter = this.buildDateFilter(from, to);

    const groups = await this.prisma.order.groupBy({
      by: ['status'],
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      _count: { _all: true },
      _sum: { total: true },
    });

    return groups.map((g) => ({
      status: g.status,
      count: g._count._all,
      total: g._sum.total,
    }));
  }

  async waiterPerformance(from?: string, to?: string) {
    const dateFilter = this.buildDateFilter(from, to);

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.CLOSED,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      include: {
        waiter: { select: { id: true, name: true, email: true } },
      },
    });

    const map = new Map<
      string,
      {
        waiter: { id: string; name: string; email: string };
        ordersCount: number;
        totalSales: Prisma.Decimal;
      }
    >();

    for (const order of orders) {
      const current = map.get(order.waiterId) ?? {
        waiter: order.waiter,
        ordersCount: 0,
        totalSales: new Prisma.Decimal(0),
      };
      current.ordersCount += 1;
      current.totalSales = current.totalSales.add(order.total);
      map.set(order.waiterId, current);
    }

    return Array.from(map.values()).sort((a, b) =>
      b.totalSales.comparedTo(a.totalSales),
    );
  }

  async topMenuItems(limit = 10, from?: string, to?: string) {
    const dateFilter = this.buildDateFilter(from, to);

    const items = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: dateFilter
        ? { order: { createdAt: dateFilter } }
        : undefined,
      _sum: { quantity: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: items.map((i) => i.menuItemId) } },
      include: { category: true },
    });

    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    return items.map((item) => ({
      menuItem: menuMap.get(item.menuItemId),
      quantitySold: item._sum.quantity,
      orderCount: item._count._all,
    }));
  }

  async tableOccupancy() {
    const tables = await this.prisma.table.findMany({
      orderBy: { number: 'asc' },
      include: {
        currentWaiter: { select: { id: true, name: true } },
        _count: {
          select: {
            orders: { where: { status: { not: OrderStatus.CLOSED } } },
          },
        },
      },
    });

    const byStatus: Record<string, number> = {};
    for (const table of tables) {
      byStatus[table.status] = (byStatus[table.status] ?? 0) + 1;
    }

    return {
      totalTables: tables.length,
      byStatus,
      tables,
    };
  }

  private buildDateFilter(from?: string, to?: string) {
    if (!from && !to) return undefined;
    return {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
}
