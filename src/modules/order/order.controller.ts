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
import { OrderService } from './order.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { ZodBody } from 'src/common/validation/validation.decorator';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from 'src/generated/prisma/client';
import { CreateOrderRequest } from './dto/create-order.dto';
import { UpdateOrderRequest } from './dto/update-order.dto';
import { OrderValidation } from './order.validation';
import { generateMessage } from 'src/common/utils/message.util';
import WebResponse from 'src/models/web.model';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAccessAuthGuard)
export class OrderController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly orderService: OrderService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard)
  @Roles('USER')
  async create(
    @Auth() user: User,
    @ZodBody(OrderValidation.CREATE) request: CreateOrderRequest,
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'ORDER',
      'CONTROLLER',
      'Create order request received',
      {
        userId: user.id,
      },
    );
    const result = await this.orderService.create(user.id, request);
    const message = generateMessage({ action: 'create', subject: 'order' });

    this.loggerService.info(
      'ORDER',
      'CONTROLLER',
      'Order created successfully',
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
      'ORDER',
      'CONTROLLER',
      'Fetch all orders request received',
      {
        userId: user.id,
        role: user.role,
      },
    );
    const result = await this.orderService.findAll(user.id, user.role);
    const message = generateMessage({ action: 'fetch', subject: 'orders' });

    this.loggerService.info(
      'ORDER',
      'CONTROLLER',
      'Orders fetched successfully',
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
      'ORDER',
      'CONTROLLER',
      'Fetch order by id request received',
      {
        id,
        userId: user.id,
      },
    );
    const result = await this.orderService.findById(id, user.id, user.role);
    const message = generateMessage({ action: 'fetch', subject: 'order' });

    this.loggerService.info(
      'ORDER',
      'CONTROLLER',
      'Order fetched successfully',
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
  async update(
    @Auth() user: User,
    @Param('id', ParseIntPipe) id: number,
    @ZodBody(OrderValidation.UPDATE) request: UpdateOrderRequest,
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'ORDER',
      'CONTROLLER',
      'Update order request received',
      {
        id,
        userId: user.id,
      },
    );
    const result = await this.orderService.update(
      id,
      user.id,
      user.role,
      request,
    );
    const message = generateMessage({ action: 'update', subject: 'order' });

    this.loggerService.info(
      'ORDER',
      'CONTROLLER',
      'Order updated successfully',
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
    @Auth() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'ORDER',
      'CONTROLLER',
      'Delete order request received',
      {
        id,
        performed_by: user.email,
      },
    );
    const result = await this.orderService.remove(id);
    const message = generateMessage({ action: 'delete', subject: 'order' });

    this.loggerService.info(
      'ORDER',
      'CONTROLLER',
      'Order deleted successfully',
      { id },
    );
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }
}
