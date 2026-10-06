import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaService } from '@tobetake/database';
import { CategoryItem } from '@tobetake/shared-types';
import { AuthenticatedAdminUser } from '../decorators/current-user.decorator';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/category.dto';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminCategoriesService {
  private readonly logger = new Logger(AdminCategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * List all categories with product counts and hierarchy.
   */
  async listCategories(query: CategoryQueryDto): Promise<CategoryItem[]> {
    const where: Prisma.CategoryWhereInput = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.parentId !== undefined) {
      where.parentId = query.parentId;
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { slug: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            products: { where: { isDeleted: false } },
            subcategories: true,
          },
        },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentId: c.parentId,
      parentName: c.parent?.name || null,
      isActive: c.isActive,
      displayOrder: c.displayOrder,
      productCount: c._count.products,
      subcategoriesCount: c._count.subcategories,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  /**
   * Get single category by ID.
   */
  async getCategory(id: number): Promise<CategoryItem> {
    const c = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            products: { where: { isDeleted: false } },
            subcategories: true,
          },
        },
      },
    });

    if (!c) {
      throw new NotFoundException(`Category with ID '${id}' was not found`);
    }

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentId: c.parentId,
      parentName: c.parent?.name || null,
      isActive: c.isActive,
      displayOrder: c.displayOrder,
      productCount: c._count.products,
      subcategoriesCount: c._count.subcategories,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  /**
   * Create a new category.
   */
  async createCategory(
    dto: CreateCategoryDto,
    admin: AuthenticatedAdminUser,
  ): Promise<CategoryItem> {
    const slug =
      dto.slug?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
      dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existingSlug = await this.prisma.category.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException(`A category with slug '${slug}' already exists`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new BadRequestException(`Parent category with ID '${dto.parentId}' does not exist`);
      }
    }

    const created = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description || null,
        parentId: dto.parentId || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        displayOrder: dto.displayOrder || 0,
      },
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'CATEGORY_CREATED',
      targetType: 'Category',
      targetId: String(created.id),
      details: {
        name: created.name,
        slug: created.slug,
        parentId: created.parentId,
      },
    });

    return this.getCategory(created.id);
  }

  /**
   * Update category.
   */
  async updateCategory(
    id: number,
    dto: UpdateCategoryDto,
    admin: AuthenticatedAdminUser,
  ): Promise<CategoryItem> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' was not found`);
    }

    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`A category with slug '${dto.slug}' already exists`);
      }
    }

    const data: Prisma.CategoryUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.parentId !== undefined) {
      data.parent = dto.parentId ? { connect: { id: dto.parentId } } : { disconnect: true };
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;

    await this.prisma.category.update({
      where: { id },
      data,
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'CATEGORY_UPDATED',
      targetType: 'Category',
      targetId: String(id),
      details: {
        updates: dto,
      },
    });

    return this.getCategory(id);
  }

  /**
   * Toggle category activation state.
   */
  async toggleCategoryStatus(id: number, admin: AuthenticatedAdminUser): Promise<CategoryItem> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' was not found`);
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });

    await this.auditService.recordLog({
      actor: admin,
      action: 'CATEGORY_STATUS_TOGGLED',
      targetType: 'Category',
      targetId: String(id),
      details: {
        previousState: category.isActive,
        newState: updated.isActive,
      },
    });

    return this.getCategory(id);
  }
}
