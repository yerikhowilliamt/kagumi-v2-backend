import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { CreateCustomOrderOptionDto } from './dto/create-custom-order-option.dto';
import { UpdateCustomOrderOptionDto } from './dto/update-custom-order-option.dto';

@Injectable()
export class CustomOrderOptionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerService,
  ) {}

  async create(payload: CreateCustomOrderOptionDto) {
    this.loggerService.info('CUSTOM_ORDER_OPTION', 'SERVICE', 'Creating custom order option', {
      productId: payload.productId,
      label: payload.label,
    });

    const product = await this.prismaService.product.findUnique({
      where: { id: payload.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product not found with ID: ${payload.productId}`);
    }

    const result = await this.prismaService.customOrderOption.create({
      data: {
        productId: payload.productId,
        label: payload.label,
        placeholder: payload.placeholder,
        required: payload.required ?? false,
      },
      include: {
        product: true,
      },
    });

    this.loggerService.info('CUSTOM_ORDER_OPTION', 'SERVICE', 'Custom order option created successfully', {
      id: result.id,
    });

    return result;
  }

  async findAll() {
    this.loggerService.info('CUSTOM_ORDER_OPTION', 'SERVICE', 'Fetching all custom order options');

    const options = await this.prismaService.customOrderOption.findMany({
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    this.loggerService.info('CUSTOM_ORDER_OPTION', 'SERVICE', 'Custom order options fetched', {
      count: options.length,
    });

    return options;
  }

  async findById(id: number) {
    this.loggerService.info('CUSTOM_ORDER_OPTION', 'SERVICE', 'Fetching custom order option by ID', { id });

    const option = await this.prismaService.customOrderOption.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!option) {
      throw new NotFoundException(`Custom order option not found with ID: ${id}`);
    }

    return option;
  }

  async update(id: number, payload: UpdateCustomOrderOptionDto) {
    this.loggerService.info('CUSTOM_ORDER_OPTION', 'SERVICE', 'Updating custom order option', { id, payload });

    const option = await this.prismaService.customOrderOption.findUnique({
      where: { id },
    });

    if (!option) {
      throw new NotFoundException(`Custom order option not found with ID: ${id}`);
    }

    if (payload.productId !== undefined) {
      const product = await this.prismaService.product.findUnique({
        where: { id: payload.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product not found with ID: ${payload.productId}`);
      }
    }

    const result = await this.prismaService.customOrderOption.update({
      where: { id },
      data: {
        productId: payload.productId !== undefined ? payload.productId : option.productId,
        label: payload.label !== undefined ? payload.label : option.label,
        placeholder: payload.placeholder !== undefined ? payload.placeholder : option.placeholder,
        required: payload.required !== undefined ? payload.required : option.required,
      },
      include: {
        product: true,
      },
    });

    this.loggerService.info('CUSTOM_ORDER_OPTION', 'SERVICE', 'Custom order option updated successfully', { id });

    return result;
  }

  async remove(id: number) {
    this.loggerService.info('CUSTOM_ORDER_OPTION', 'SERVICE', 'Deleting custom order option', { id });

    const option = await this.prismaService.customOrderOption.findUnique({
      where: { id },
    });

    if (!option) {
      throw new NotFoundException(`Custom order option not found with ID: ${id}`);
    }

    const result = await this.prismaService.customOrderOption.delete({
      where: { id },
    });

    this.loggerService.info('CUSTOM_ORDER_OPTION', 'SERVICE', 'Custom order option deleted successfully', { id });

    return result;
  }
}
