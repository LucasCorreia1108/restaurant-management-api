import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Sales summary by period (Admin)' })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31' })
  salesSummary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.salesSummary(from, to);
  }

  @Get('orders-by-status')
  @ApiOperation({ summary: 'Orders grouped by status (Admin)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  ordersByStatus(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.ordersByStatus(from, to);
  }

  @Get('waiter-performance')
  @ApiOperation({ summary: 'Waiter sales performance (Admin)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  waiterPerformance(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.waiterPerformance(from, to);
  }

  @Get('top-menu-items')
  @ApiOperation({ summary: 'Top selling menu items (Admin)' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  topMenuItems(
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.topMenuItems(
      limit ? Number(limit) : 10,
      from,
      to,
    );
  }

  @Get('table-occupancy')
  @ApiOperation({ summary: 'Current table occupancy snapshot (Admin)' })
  tableOccupancy() {
    return this.reportsService.tableOccupancy();
  }
}
