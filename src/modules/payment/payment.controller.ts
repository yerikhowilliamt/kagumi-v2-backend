import { Controller, Get, Post, Patch, Delete, Param, ParseIntPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { ZodBody } from 'src/common/validation/validation.decorator';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from 'src/generated/prisma/client';
import { CreatePaymentRequest } from './dto/create-payment.dto';
import { UpdatePaymentRequest } from './dto/update-payment.dto';
import { PaymentValidation } from './payment.validation';
import { generateMessage } from 'src/common/utils/message.util';
import WebResponse from 'src/models/web.model';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAccessAuthGuard)
export class PaymentController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly paymentService: PaymentService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard)
  @Roles('USER', 'ADMIN')
  async create(
    @Auth() user: User,
    @ZodBody(PaymentValidation.CREATE) request: CreatePaymentRequest,
  ): Promise<WebResponse<any>> {
    this.loggerService.info('PAYMENT', 'CONTROLLER', 'Create payment request received', {
      userId: user.id,
    });
    const result = await this.paymentService.create(user.id, user.role, request);
    const message = generateMessage({ action: 'create', subject: 'payment' });

    this.loggerService.info('PAYMENT', 'CONTROLLER', 'Payment created successfully', {
      id: result?.id,
    });
    return this.responseService.success({
      data: result,
      status: HttpStatus.CREATED,
      message,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('USER', 'ADMIN')
  async findAll(@Auth() user: User): Promise<WebResponse<any[]>> {
    this.loggerService.info('PAYMENT', 'CONTROLLER', 'Fetch all payments request received', {
      userId: user.id,
      role: user.role,
    });
    const result = await this.paymentService.findAll(user.id, user.role);
    const message = generateMessage({ action: 'fetch', subject: 'payments' });

    this.loggerService.info('PAYMENT', 'CONTROLLER', 'Payments fetched successfully', {
      count: result.length,
    });
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('USER', 'ADMIN')
  async findById(
    @Auth() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WebResponse<any>> {
    this.loggerService.info('PAYMENT', 'CONTROLLER', 'Fetch payment by id request received', {
      id,
      userId: user.id,
    });
    const result = await this.paymentService.findById(id, user.id, user.role);
    const message = generateMessage({ action: 'fetch', subject: 'payment' });

    this.loggerService.info('PAYMENT', 'CONTROLLER', 'Payment fetched successfully', { id });
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
    @Auth() user: User,
    @Param('id', ParseIntPipe) id: number,
    @ZodBody(PaymentValidation.UPDATE) request: UpdatePaymentRequest,
  ): Promise<WebResponse<any>> {
    this.loggerService.info('PAYMENT', 'CONTROLLER', 'Update payment request received', {
      id,
      userId: user.id,
    });
    const result = await this.paymentService.update(id, user.id, user.role, request);
    const message = generateMessage({ action: 'update', subject: 'payment' });

    this.loggerService.info('PAYMENT', 'CONTROLLER', 'Payment updated successfully', { id });
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
    this.loggerService.info('PAYMENT', 'CONTROLLER', 'Delete payment request received', {
      id,
      performed_by: user.email,
    });
    const result = await this.paymentService.remove(id, user.role);
    const message = generateMessage({ action: 'delete', subject: 'payment' });

    this.loggerService.info('PAYMENT', 'CONTROLLER', 'Payment deleted successfully', { id });
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }
}
