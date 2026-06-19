import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreatePaymentRequest } from './dto/create-payment.dto';
import { UpdatePaymentRequest } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(userId: number, role: string, payload: CreatePaymentRequest) {
    this.loggerService.info('PAYMENT', 'SERVICE', 'Creating payment initiated', { userId, payload });

    // 1. Verify that the order exists
    const order = await this.prismaService.order.findUnique({
      where: { id: payload.orderId },
    });

    if (!order) {
      this.loggerService.warn('PAYMENT', 'SERVICE', 'Order not found for payment creation', {
        orderId: payload.orderId,
      });
      throw new NotFoundException(`Order not found with ID: ${payload.orderId}`);
    }

    // 2. Access control: Only ADMIN or the Order Owner can make a payment
    const isAdmin = role === 'ADMIN';
    if (!isAdmin && order.userId !== userId) {
      this.loggerService.warn('PAYMENT', 'SERVICE', 'Unauthorized payment attempt for order', {
        orderId: payload.orderId,
        userId,
      });
      throw new ForbiddenException('You are not authorized to make a payment for this order');
    }

    // 3. Create the payment record
    const payment = await this.prismaService.payment.create({
      data: {
        orderId: payload.orderId,
        userId: order.userId, // Maintain consistency with order owner
        transactionId: payload.transactionId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        status: payload.status || 'PENDING',
        paymentProof: payload.paymentProof,
        metadata: payload.metadata || undefined,
      },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.loggerService.info('PAYMENT', 'SERVICE', 'Payment created successfully', { id: payment.id });
    return payment;
  }

  async findAll(userId: number, role: string) {
    this.loggerService.info('PAYMENT', 'SERVICE', 'Fetching payments initiated', { userId, role });

    const isAdmin = role === 'ADMIN';
    const where = isAdmin ? {} : { userId };

    const payments = await this.prismaService.payment.findMany({
      where,
      include: {
        order: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    this.loggerService.info('PAYMENT', 'SERVICE', 'Payments fetched successfully', { count: payments.length });
    return payments;
  }

  async findById(id: number, userId: number, role: string) {
    this.loggerService.info('PAYMENT', 'SERVICE', 'Fetching payment by ID initiated', { id, userId, role });

    const payment = await this.prismaService.payment.findUnique({
      where: { id },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      this.loggerService.warn('PAYMENT', 'SERVICE', 'Payment not found', { id });
      throw new NotFoundException('Payment not found');
    }

    const isAdmin = role === 'ADMIN';
    if (!isAdmin && payment.userId !== userId) {
      this.loggerService.warn('PAYMENT', 'SERVICE', 'Unauthorized access to payment', { id, userId });
      throw new ForbiddenException('You are not authorized to view this payment');
    }

    this.loggerService.info('PAYMENT', 'SERVICE', 'Payment fetched successfully', { id });
    return payment;
  }

  async update(id: number, userId: number, role: string, payload: UpdatePaymentRequest) {
    this.loggerService.info('PAYMENT', 'SERVICE', 'Updating payment initiated', { id, userId, role, payload });

    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can update payments');
    }

    // Verify payment exists
    const payment = await this.prismaService.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updated = await this.prismaService.payment.update({
      where: { id },
      data: {
        orderId: payload.orderId,
        transactionId: payload.transactionId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        status: payload.status,
        paymentProof: payload.paymentProof,
        metadata: payload.metadata || undefined,
        failureReason: payload.failureReason,
        refundAmount: payload.refundAmount,
        refundedAt: payload.refundedAt ? new Date(payload.refundedAt) : undefined,
      },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.loggerService.info('PAYMENT', 'SERVICE', 'Payment updated successfully', { id });
    return updated;
  }

  async remove(id: number, role: string) {
    this.loggerService.info('PAYMENT', 'SERVICE', 'Deleting payment initiated', { id, role });

    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can delete payments');
    }

    // Verify payment exists
    const payment = await this.prismaService.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const deleted = await this.prismaService.payment.delete({
      where: { id },
    });

    this.loggerService.info('PAYMENT', 'SERVICE', 'Payment deleted successfully', { id });
    return deleted;
  }
}
