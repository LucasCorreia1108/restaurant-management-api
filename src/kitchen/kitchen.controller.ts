import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KitchenService } from './kitchen.service';
import { KitchenStatusDto } from './dto/kitchen.dto';
import { Roles, CurrentUser } from '../common/decorators';
import type { AuthUser } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('Kitchen')
@ApiBearerAuth()
@Controller('kitchen')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('queue')
  @Roles(Role.KITCHEN, Role.ADMIN)
  @ApiOperation({ summary: 'Get kitchen order queue' })
  getQueue() {
    return this.kitchenService.getQueue();
  }

  @Post('orders/:id/preparing')
  @Roles(Role.KITCHEN, Role.ADMIN)
  @ApiOperation({ summary: 'Set order status to PREPARING (RN007)' })
  startPreparing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: KitchenStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.kitchenService.startPreparing(id, user, dto.notes);
  }

  @Post('orders/:id/ready')
  @Roles(Role.KITCHEN, Role.ADMIN)
  @ApiOperation({ summary: 'Set order status to READY (RN007)' })
  markReady(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: KitchenStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.kitchenService.markReady(id, user, dto.notes);
  }
}
