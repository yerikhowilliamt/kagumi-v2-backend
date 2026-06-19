import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateCategoryRequest } from './dto/create-category.dto';
import { UpdateCategoryRequest } from './dto/update-category.dto';
import { Category } from 'src/generated/prisma/client';

@Injectable()
export class CategoryService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(payload: CreateCategoryRequest): Promise<Category> {
    this.loggerService.info(
      'CATEGORY',
      'SERVICE',
      'Creating category initiated',
      { payload },
    );

    const nameExists = await this.prismaService.category.findUnique({
      where: { name: payload.name },
    });

    if (nameExists) {
      throw new BadRequestException('Category name already exists');
    }

    if (payload.parentId) {
      const parentExists = await this.prismaService.category.findUnique({
        where: { id: payload.parentId },
      });
      if (!parentExists) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = await this.prismaService.category.create({
      data: {
        name: payload.name,
        description: payload.description,
        parentId: payload.parentId ?? null,
      },
    });

    this.loggerService.info(
      'CATEGORY',
      'SERVICE',
      'Category created successfully',
      { id: category.id },
    );
    return category;
  }

  async findAll(): Promise<Category[]> {
    this.loggerService.info(
      'CATEGORY',
      'SERVICE',
      'Fetching all categories initiated',
    );
    const categories = await this.prismaService.category.findMany({
      include: {
        parent: true,
        children: true,
      },
    });
    this.loggerService.info(
      'CATEGORY',
      'SERVICE',
      'All categories fetched successfully',
      { count: categories.length },
    );
    return categories;
  }

  async findById(id: number): Promise<Category> {
    this.loggerService.info(
      'CATEGORY',
      'SERVICE',
      'Fetching category by id initiated',
      { id },
    );
    const category = await this.prismaService.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      this.loggerService.warn('CATEGORY', 'SERVICE', 'Category not found', {
        id,
      });
      throw new NotFoundException('Category not found');
    }

    this.loggerService.info(
      'CATEGORY',
      'SERVICE',
      'Category fetched successfully',
      { id },
    );
    return category;
  }

  async update(id: number, payload: UpdateCategoryRequest): Promise<Category> {
    this.loggerService.info(
      'CATEGORY',
      'SERVICE',
      'Updating category initiated',
      { id, payload },
    );
    const category = await this.findById(id);

    if (payload.name && payload.name !== category.name) {
      const nameExists = await this.prismaService.category.findUnique({
        where: { name: payload.name },
      });
      if (nameExists) {
        throw new BadRequestException('Category name already exists');
      }
    }

    if (payload.parentId) {
      if (payload.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      const parentExists = await this.prismaService.category.findUnique({
        where: { id: payload.parentId },
      });
      if (!parentExists) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const updatedCategory = await this.prismaService.category.update({
      where: { id },
      data: {
        name: payload.name,
        description: payload.description,
        parentId:
          payload.parentId === null
            ? null
            : (payload.parentId ?? category.parentId),
      },
    });

    this.loggerService.info(
      'CATEGORY',
      'SERVICE',
      'Category updated successfully',
      { id },
    );
    return updatedCategory;
  }

  async remove(id: number): Promise<Category> {
    this.loggerService.info(
      'CATEGORY',
      'SERVICE',
      'Deleting category initiated',
      { id },
    );
    const category = await this.prismaService.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
      },
    });

    if (!category) {
      this.loggerService.warn(
        'CATEGORY',
        'SERVICE',
        'Category not found for deletion',
        { id },
      );
      throw new NotFoundException('Category not found');
    }

    if (category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category that has sub-categories',
      );
    }

    if (category.products.length > 0) {
      throw new BadRequestException('Cannot delete category that has products');
    }

    const deletedCategory = await this.prismaService.category.delete({
      where: { id },
    });

    this.loggerService.info(
      'CATEGORY',
      'SERVICE',
      'Category deleted successfully',
      { id },
    );
    return deletedCategory;
  }
}
