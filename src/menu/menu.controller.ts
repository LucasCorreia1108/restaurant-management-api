import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';
import { Roles } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('Menu')
@ApiBearerAuth()
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create menu item (Admin)' })
  create(@Body() dto: CreateMenuItemDto) {
    return this.menuService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.WAITER, Role.KITCHEN, Role.CASHIER)
  @ApiOperation({ summary: 'List menu items' })
  @ApiQuery({ name: 'availableOnly', required: false, type: Boolean })
  findAll(
    @Query('availableOnly', new ParseBoolPipe({ optional: true }))
    availableOnly?: boolean,
  ) {
    return this.menuService.findAll(availableOnly ?? false);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.WAITER)
  @ApiOperation({ summary: 'Get menu item by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update menu item (Admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete menu item (Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.remove(id);
  }
}
