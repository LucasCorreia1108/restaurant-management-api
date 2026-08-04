import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCategoryDto) {
    this.logger.log(`Creating category: ${dto.name}`);
    return this.prisma.category.create({ data: dto });
  }

  findAll() {
    return this.prisma.category.findMany({
      include: { _count: { select: { menuItems: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { menuItems: true },
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    return { message: `Category ${id} deleted successfully` };
  }
}
