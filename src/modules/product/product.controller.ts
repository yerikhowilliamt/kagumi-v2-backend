import { Controller, Get, Post, Patch, Delete, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductService } from './product.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { ZodBody } from 'src/common/validation/validation.decorator';
import { CreateProductRequest } from './dto/create-product.dto';
import { UpdateProductRequest } from './dto/update-product.dto';
import { ProductValidation } from './product.validation';
import { generateMessage } from 'src/common/utils/message.util';
import WebResponse from 'src/models/web.model';
import { Product } from 'src/generated/prisma/client';

@Controller('products')
export class ProductController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly productService: ProductService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @ZodBody(ProductValidation.CREATE) request: CreateProductRequest,
  ): Promise<WebResponse<Product>> {
    this.loggerService.info('PRODUCT', 'CONTROLLER', 'Create product request received', { name: request.name });
    const result = await this.productService.create(request);
    const message = generateMessage({ action: 'create', subject: 'product' });

    this.loggerService.info('PRODUCT', 'CONTROLLER', 'Product created successfully', { id: result.id });
    return this.responseService.success({
      data: result,
      status: HttpStatus.CREATED,
      message,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<WebResponse<Product[]>> {
    this.loggerService.info('PRODUCT', 'CONTROLLER', 'Fetch all products request received');
    const result = await this.productService.findAll();
    const message = generateMessage({ action: 'fetch', subject: 'product' });

    this.loggerService.info('PRODUCT', 'CONTROLLER', 'Products fetched successfully', { count: result.length });
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WebResponse<Product>> {
    this.loggerService.info('PRODUCT', 'CONTROLLER', 'Fetch product by id request received', { id });
    const result = await this.productService.findById(id);
    const message = generateMessage({ action: 'fetch', subject: 'product' });

    this.loggerService.info('PRODUCT', 'CONTROLLER', 'Product fetched successfully', { id });
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ZodBody(ProductValidation.UPDATE) request: UpdateProductRequest,
  ): Promise<WebResponse<Product>> {
    this.loggerService.info('PRODUCT', 'CONTROLLER', 'Update product request received', { id });
    const result = await this.productService.update(id, request);
    const message = generateMessage({ action: 'update', subject: 'product' });

    this.loggerService.info('PRODUCT', 'CONTROLLER', 'Product updated successfully', { id });
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WebResponse<Product>> {
    this.loggerService.info('PRODUCT', 'CONTROLLER', 'Delete product request received', { id });
    const result = await this.productService.remove(id);
    const message = generateMessage({ action: 'delete', subject: 'product' });

    this.loggerService.info('PRODUCT', 'CONTROLLER', 'Product deleted successfully', { id });
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }
}
