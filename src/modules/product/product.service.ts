import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateProductRequest } from './dto/create-product.dto';
import { UpdateProductRequest } from './dto/update-product.dto';
import { Product } from 'src/generated/prisma/client';

@Injectable()
export class ProductService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(payload: CreateProductRequest): Promise<Product> {
    this.loggerService.info('PRODUCT', 'SERVICE', 'Creating product initiated', { payload });

    const categoryExists = await this.prismaService.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!categoryExists) {
      this.loggerService.warn('PRODUCT', 'SERVICE', 'Category not found for product creation', {
        categoryId: payload.categoryId,
      });
      throw new NotFoundException('Category not found');
    }

    const product = await this.prismaService.product.create({
      data: {
        categoryId: payload.categoryId,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        type: payload.type,
        stock: payload.stock ?? 0,
      },
    });

    this.loggerService.info('PRODUCT', 'SERVICE', 'Product created successfully', { id: product.id });
    return product;
  }

  async findAll(): Promise<Product[]> {
    this.loggerService.info('PRODUCT', 'SERVICE', 'Fetching all products initiated');
    const products = await this.prismaService.product.findMany({
      include: {
        category: true,
      },
    });
    this.loggerService.info('PRODUCT', 'SERVICE', 'All products fetched successfully', { count: products.length });
    return products;
  }

  async findById(id: number): Promise<Product> {
    this.loggerService.info('PRODUCT', 'SERVICE', 'Fetching product by id initiated', { id });
    const product = await this.prismaService.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      this.loggerService.warn('PRODUCT', 'SERVICE', 'Product not found', { id });
      throw new NotFoundException('Product not found');
    }

    this.loggerService.info('PRODUCT', 'SERVICE', 'Product fetched successfully', { id });
    return product;
  }

  async update(id: number, payload: UpdateProductRequest): Promise<Product> {
    this.loggerService.info('PRODUCT', 'SERVICE', 'Updating product initiated', { id, payload });
    
    // Check if product exists
    await this.findById(id);

    if (payload.categoryId) {
      const categoryExists = await this.prismaService.category.findUnique({
        where: { id: payload.categoryId },
      });
      if (!categoryExists) {
        this.loggerService.warn('PRODUCT', 'SERVICE', 'Category not found for product update', {
          categoryId: payload.categoryId,
        });
        throw new NotFoundException('Category not found');
      }
    }

    const updatedProduct = await this.prismaService.product.update({
      where: { id },
      data: {
        categoryId: payload.categoryId,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        type: payload.type,
        stock: payload.stock,
      },
    });

    this.loggerService.info('PRODUCT', 'SERVICE', 'Product updated successfully', { id });
    return updatedProduct;
  }

  async remove(id: number): Promise<Product> {
    this.loggerService.info('PRODUCT', 'SERVICE', 'Deleting product initiated', { id });
    
    // Check if product exists
    await this.findById(id);

    const deletedProduct = await this.prismaService.product.delete({
      where: { id },
    });

    this.loggerService.info('PRODUCT', 'SERVICE', 'Product deleted successfully', { id });
    return deletedProduct;
  }
}
