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
import { CustomOrderOptionService } from './custom-order-option.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { ZodBody } from 'src/common/validation/validation.decorator';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { CreateCustomOrderOptionDto } from './dto/create-custom-order-option.dto';
import { UpdateCustomOrderOptionDto } from './dto/update-custom-order-option.dto';
import { CustomOrderOptionValidation } from './custom-order-option.validation';
import { generateMessage } from 'src/common/utils/message.util';
import WebResponse from 'src/models/web.model';
import { PaginationRequest } from 'src/models/pagination.model';
import { PaginationValidation } from 'src/common/validation/pagination.validation';
import { ZodQuery } from 'src/common/validation/validation.decorator';

@ApiTags('Custom Orders')
@Controller('custom-orders')
export class CustomOrderOptionController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly customOrderOptionService: CustomOrderOptionService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAccessAuthGuard, RoleGuard)
  @Roles('ADMIN')
  async create(
    @ZodBody(CustomOrderOptionValidation.CREATE) request: CreateCustomOrderOptionDto,
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'CUSTOM_ORDER_OPTION',
      'CONTROLLER',
      'Create custom order option request received',
      {
        productId: request.productId,
        label: request.label,
      },
    );

    const result = await this.customOrderOptionService.create(request);
    const message = generateMessage({ action: 'create', subject: 'custom order option' });

    this.loggerService.info(
      'CUSTOM_ORDER_OPTION',
      'CONTROLLER',
      'Custom order option created successfully',
      {
        id: result?.id,
      },
    );

    return this.responseService.success({
      data: result,
      status: HttpStatus.CREATED,
      message,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @ZodQuery(PaginationValidation.QUERY) request: PaginationRequest,
  ): Promise<WebResponse<any[]>> {
    this.loggerService.info(
      'CUSTOM_ORDER_OPTION',
      'CONTROLLER',
      'Fetch all custom order options request received',
    );

    const result = await this.customOrderOptionService.findAll(request);
    const message = generateMessage({ action: 'fetch', subject: 'custom order options' });

    this.loggerService.info(
      'CUSTOM_ORDER_OPTION',
      'CONTROLLER',
      'Custom order options fetched successfully',
      {
        count: result.data.length,
      },
    );

    return this.responseService.success({
      data: result.data,
      status: HttpStatus.OK,
      message,

      paging: result.paging,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'CUSTOM_ORDER_OPTION',
      'CONTROLLER',
      'Fetch custom order option by id request received',
      { id },
    );

    const result = await this.customOrderOptionService.findById(id);
    const message = generateMessage({ action: 'fetch', subject: 'custom order option' });

    this.loggerService.info(
      'CUSTOM_ORDER_OPTION',
      'CONTROLLER',
      'Custom order option fetched successfully',
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
  @UseGuards(JwtAccessAuthGuard, RoleGuard)
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ZodBody(CustomOrderOptionValidation.UPDATE) request: UpdateCustomOrderOptionDto,
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'CUSTOM_ORDER_OPTION',
      'CONTROLLER',
      'Update custom order option request received',
      { id },
    );

    const result = await this.customOrderOptionService.update(id, request);
    const message = generateMessage({ action: 'update', subject: 'custom order option' });

    this.loggerService.info(
      'CUSTOM_ORDER_OPTION',
      'CONTROLLER',
      'Custom order option updated successfully',
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
  @UseGuards(JwtAccessAuthGuard, RoleGuard)
  @Roles('ADMIN')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'CUSTOM_ORDER_OPTION',
      'CONTROLLER',
      'Delete custom order option request received',
      { id },
    );

    const result = await this.customOrderOptionService.remove(id);
    const message = generateMessage({ action: 'delete', subject: 'custom order option' });

    this.loggerService.info(
      'CUSTOM_ORDER_OPTION',
      'CONTROLLER',
      'Custom order option deleted successfully',
      { id },
    );

    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }
}
