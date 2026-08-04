import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import {
  CreateTableDto,
  UpdateTableDto,
  OpenTableDto,
} from './dto/table.dto';
import { Roles, CurrentUser } from '../common/decorators';
import type { AuthUser } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('Tables')
@ApiBearerAuth()
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create table (Admin)' })
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.WAITER, Role.CASHIER, Role.KITCHEN)
  @ApiOperation({ summary: 'List all tables' })
  findAll() {
    return this.tablesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.WAITER, Role.CASHIER)
  @ApiOperation({ summary: 'Get table details with open orders' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tablesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update table (Admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tablesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete table (Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tablesService.remove(id);
  }

  @Post(':id/open')
  @Roles(Role.WAITER, Role.ADMIN)
  @ApiOperation({ summary: 'Open table and assign waiter (RN001)' })
  open(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OpenTableDto,
    @CurrentUser() user: AuthUser,
  ) {
    const waiterId = user.role === Role.WAITER ? user.id : dto.waiterId;
    if (!waiterId) {
      throw new BadRequestException(
        'waiterId is required when opening a table as ADMIN',
      );
    }
    return this.tablesService.open(id, { waiterId });
  }

  @Post(':id/request-bill')
  @Roles(Role.WAITER, Role.ADMIN)
  @ApiOperation({ summary: 'Request bill closure for a table' })
  requestBill(@Param('id', ParseUUIDPipe) id: string) {
    return this.tablesService.requestBill(id);
  }
}
