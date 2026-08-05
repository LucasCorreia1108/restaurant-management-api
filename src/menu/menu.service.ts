import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../uploads/cloudinary/cloudinary.service';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  UpdateMenuItemImageDto,
} from './dto/menu-item.dto';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

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
        imageUrl: dto.imageUrl,
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
    const current = await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category ${dto.categoryId} not found`);
      }
    }

    if (dto.imageUrl && current.imageUrl && dto.imageUrl !== current.imageUrl) {
      await this.safeDeleteCloudinaryImage(current.imageUrl);
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async updateImage(id: string, dto: UpdateMenuItemImageDto) {
    const current = await this.findOne(id);

    if (current.imageUrl && current.imageUrl !== dto.imageUrl) {
      await this.safeDeleteCloudinaryImage(current.imageUrl);
    }

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: { imageUrl: dto.imageUrl },
      include: { category: true },
    });

    this.logger.log(`Updated image for menu item ${id}`);
    return updated;
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    if (item.imageUrl) {
      await this.safeDeleteCloudinaryImage(item.imageUrl);
    }
    await this.prisma.menuItem.delete({ where: { id } });
    return { message: `Menu item ${id} deleted successfully` };
  }

  private async safeDeleteCloudinaryImage(imageUrl: string) {
    const publicId = this.cloudinary.extractPublicId(imageUrl);
    if (!publicId) return;
    try {
      await this.cloudinary.deleteImage(publicId);
    } catch (error) {
      this.logger.warn(
        `Failed to delete Cloudinary image ${publicId}: ${String(error)}`,
      );
    }
  }
}
