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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrderItemService } from './order-item.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { ZodBody } from 'src/common/validation/validation.decorator';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from 'src/generated/prisma/client';
import { CreateOrderItemRequest } from './dto/create-order-item.dto';
import { UpdateOrderItemRequest } from './dto/update-order-item.dto';
import { OrderItemValidation } from './order-item.validation';
import { generateMessage } from 'src/common/utils/message.util';
import WebResponse from 'src/models/web.model';

@Controller('order-items')
@UseGuards(JwtAccessAuthGuard)
export class OrderItemController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly orderItemService: OrderItemService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard)
  @Roles('USER', 'ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Auth() user: User,
    @ZodBody(OrderItemValidation.CREATE) request: CreateOrderItemRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'ORDER_ITEM',
      'CONTROLLER',
      'Create order item request received',
      {
        userId: user.id,
        orderId: request.orderId,
      },
    );

    const result = await this.orderItemService.create(
      user.id,
      user.role,
      request,
      file,
    );
    const message = generateMessage({ action: 'create', subject: 'order item' });

    this.loggerService.info(
      'ORDER_ITEM',
      'CONTROLLER',
      'Order item created successfully',
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
  async findAll(@Auth() user: User): Promise<WebResponse<any[]>> {
    this.loggerService.info(
      'ORDER_ITEM',
      'CONTROLLER',
      'Fetch all order items request received',
      {
        userId: user.id,
        role: user.role,
      },
    );

    const result = await this.orderItemService.findAll(user.id, user.role);
    const message = generateMessage({ action: 'fetch', subject: 'order items' });

    this.loggerService.info(
      'ORDER_ITEM',
      'CONTROLLER',
      'Order items fetched successfully',
      {
        count: result.length,
      },
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
    @Auth() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'ORDER_ITEM',
      'CONTROLLER',
      'Fetch order item by id request received',
      {
        id,
        userId: user.id,
        role: user.role,
      },
    );

    const result = await this.orderItemService.findById(
      id,
      user.id,
      user.role,
    );
    const message = generateMessage({ action: 'fetch', subject: 'order item' });

    this.loggerService.info(
      'ORDER_ITEM',
      'CONTROLLER',
      'Order item fetched successfully',
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
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ZodBody(OrderItemValidation.UPDATE) request: UpdateOrderItemRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'ORDER_ITEM',
      'CONTROLLER',
      'Update order item request received',
      { id },
    );

    const result = await this.orderItemService.update(id, request, file);
    const message = generateMessage({ action: 'update', subject: 'order item' });

    this.loggerService.info(
      'ORDER_ITEM',
      'CONTROLLER',
      'Order item updated successfully',
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
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'ORDER_ITEM',
      'CONTROLLER',
      'Delete order item request received',
      { id },
    );

    const result = await this.orderItemService.remove(id);
    const message = generateMessage({ action: 'delete', subject: 'order item' });

    this.loggerService.info(
      'ORDER_ITEM',
      'CONTROLLER',
      'Order item deleted successfully',
      { id },
    );

    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }
}
