import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { TablesService } from '../tables/tables.service';
import { Roles, CurrentUser } from '../common/decorators';
import type { AuthUser } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('Waiters')
@ApiBearerAuth()
@Controller('waiters')
export class WaitersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tablesService: TablesService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.CASHIER)
  @ApiOperation({ summary: 'List all waiters' })
  findAll() {
    return this.usersService.findAll(Role.WAITER);
  }

  @Get('me/tables')
  @Roles(Role.WAITER)
  @ApiOperation({ summary: 'List tables assigned to the authenticated waiter' })
  async myTables(@CurrentUser() user: AuthUser) {
    const tables = await this.tablesService.findAll();
    return tables.filter((t) => t.currentWaiterId === user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CASHIER)
  @ApiOperation({ summary: 'Get waiter by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }
}
