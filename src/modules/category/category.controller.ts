import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { ZodBody } from 'src/common/validation/validation.decorator';
import { CreateCategoryRequest } from './dto/create-category.dto';
import { UpdateCategoryRequest } from './dto/update-category.dto';
import { CategoryValidation } from './category.validation';
import { generateMessage } from 'src/common/utils/message.util';
import WebResponse from 'src/models/web.model';
import { Category } from 'src/generated/prisma/client';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAccessAuthGuard)
export class CategoryController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly categoryService: CategoryService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  async create(
    @ZodBody(CategoryValidation.CREATE) request: CreateCategoryRequest,
  ): Promise<WebResponse<Category>> {
    this.loggerService.info(
      'CATEGORY',
      'CONTROLLER',
      'Create category request received',
      { name: request.name },
    );
    const result = await this.categoryService.create(request);
    const message = generateMessage({ action: 'create', subject: 'category' });

    this.loggerService.info(
      'CATEGORY',
      'CONTROLLER',
      'Category created successfully',
      { id: result.id },
    );
    return this.responseService.success({
      data: result,
      status: HttpStatus.CREATED,
      message,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<WebResponse<Category[]>> {
    this.loggerService.info(
      'CATEGORY',
      'CONTROLLER',
      'Fetch all categories request received',
    );
    const result = await this.categoryService.findAll();
    const message = generateMessage({ action: 'fetch', subject: 'category' });

    this.loggerService.info(
      'CATEGORY',
      'CONTROLLER',
      'Categories fetched successfully',
      { count: result.length },
    );
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
  ): Promise<WebResponse<Category>> {
    this.loggerService.info(
      'CATEGORY',
      'CONTROLLER',
      'Fetch category by id request received',
      { id },
    );
    const result = await this.categoryService.findById(id);
    const message = generateMessage({ action: 'fetch', subject: 'category' });

    this.loggerService.info(
      'CATEGORY',
      'CONTROLLER',
      'Category fetched successfully',
      { id },
    );
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ZodBody(CategoryValidation.UPDATE) request: UpdateCategoryRequest,
  ): Promise<WebResponse<Category>> {
    this.loggerService.info(
      'CATEGORY',
      'CONTROLLER',
      'Update category request received',
      { id },
    );
    const result = await this.categoryService.update(id, request);
    const message = generateMessage({ action: 'update', subject: 'category' });

    this.loggerService.info(
      'CATEGORY',
      'CONTROLLER',
      'Category updated successfully',
      { id },
    );
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WebResponse<Category>> {
    this.loggerService.info(
      'CATEGORY',
      'CONTROLLER',
      'Delete category request received',
      { id },
    );
    const result = await this.categoryService.remove(id);
    const message = generateMessage({ action: 'delete', subject: 'category' });

    this.loggerService.info(
      'CATEGORY',
      'CONTROLLER',
      'Category deleted successfully',
      { id },
    );
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }
}
