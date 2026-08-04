import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMenuItemDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category ${dto.categoryId} not found`);
    }

    this.logger.log(`Creating menu item: ${dto.name}`);
    return this.prisma.menuItem.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        preparationTime: dto.preparationTime,
        available: dto.available ?? true,
        categoryId: dto.categoryId,
      },
      include: { category: true },
    });
  }

  findAll(availableOnly = false) {
    return this.prisma.menuItem.findMany({
      where: availableOnly ? { available: true } : undefined,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!item) {
      throw new NotFoundException(`Menu item ${id} not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category ${dto.categoryId} not found`);
      }
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.menuItem.delete({ where: { id } });
    return { message: `Menu item ${id} deleted successfully` };
  }
}
