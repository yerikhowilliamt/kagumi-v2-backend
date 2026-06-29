import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreatePaymentRequest } from './dto/create-payment.dto';
import { UpdatePaymentRequest } from './dto/update-payment.dto';
import { Prisma, Payment } from 'src/generated/prisma/client';
import { PaginatedResponse, PaginationRequest } from 'src/models/pagination.model';
import { Paging } from 'src/models/web.model';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(userId: number, role: string, payload: CreatePaymentRequest, paymentProofImage?: any) {
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

    // 3. Handle file upload if paymentProofImage exists
    let paymentProofUrl = payload.paymentProof;
    if (paymentProofImage) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(paymentProofImage);
        paymentProofUrl = uploadResult.secure_url;
      } catch (error) {
        this.loggerService.error('PAYMENT', 'SERVICE', 'Failed to upload payment proof to Cloudinary', { error });
        throw new BadRequestException('Failed to upload payment proof');
      }
    }

    // 4. Create the payment record
    const payment = await this.prismaService.payment.create({
      data: {
        orderId: payload.orderId,
        userId: order.userId, // Maintain consistency with order owner
        transactionId: payload.transactionId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        status: payload.status || 'PENDING',
        paymentProof: paymentProofUrl,
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

  async findAll(userId: number, role: string, request: PaginationRequest): Promise<PaginatedResponse<Payment>> {
    this.loggerService.info('PAYMENT', 'SERVICE', 'Fetching payments initiated', { userId, role, request });

    const isAdmin = role === 'ADMIN';
    const where: Prisma.PaymentWhereInput = isAdmin ? {} : { userId };

    const skip = (request.page - 1) * request.size;

    if (request.search) {
      if (['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'].includes(request.search.toUpperCase())) {
         where.status = request.search.toUpperCase() as any;
      }
    }

    const orderBy: Prisma.PaymentOrderByWithRelationInput = {};
    if (request.sortBy) {
      orderBy[request.sortBy] = request.sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [totalData, payments] = await this.prismaService.$transaction([
      this.prismaService.payment.count({ where }),
      this.prismaService.payment.findMany({
        where,
        skip,
        take: request.size,
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
        orderBy,
      }),
    ]);

    this.loggerService.info('PAYMENT', 'SERVICE', 'Payments fetched successfully', { count: payments.length, totalData });

    return {
      data: payments as any,
      paging: new Paging({
        size: request.size,
        totalData,
        totalPage: Math.ceil(totalData / request.size),
        currentPage: request.page,
      }),
    };
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

  async update(id: number, userId: number, role: string, payload: UpdatePaymentRequest, paymentProofImage?: any) {
    this.loggerService.info('PAYMENT', 'SERVICE', 'Updating payment initiated', { id, userId, role, payload });

    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can update payments');
    }

    // Verify payment exists
    const existingPayment = await this.prismaService.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      throw new NotFoundException('Payment not found');
    }

    let paymentProofUrl = payload.paymentProof !== undefined ? payload.paymentProof : existingPayment.paymentProof;
    if (paymentProofImage) {
      try {
        // Delete old image if it was on Cloudinary
        if (existingPayment.paymentProof && existingPayment.paymentProof.includes('cloudinary')) {
          const urlParts = existingPayment.paymentProof.split('/');
          const filename = urlParts[urlParts.length - 1];
          const publicId = filename.split('.')[0];
          if (publicId) await this.cloudinaryService.destroyFile(publicId);
        }
        const uploadResult = await this.cloudinaryService.uploadFile(paymentProofImage);
        paymentProofUrl = uploadResult.secure_url;
      } catch (error) {
        this.loggerService.error('PAYMENT', 'SERVICE', 'Failed to upload payment proof to Cloudinary', { error });
      }
    }

    const updated = await this.prismaService.payment.update({
      where: { id },
      data: {
        orderId: payload.orderId,
        transactionId: payload.transactionId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        status: payload.status,
        paymentProof: paymentProofUrl,
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
