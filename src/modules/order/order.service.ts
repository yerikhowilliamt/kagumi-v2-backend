import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateOrderRequest } from './dto/create-order.dto';
import { UpdateOrderRequest } from './dto/update-order.dto';
import { Prisma, Order } from 'src/generated/prisma/client';
import { PaginatedResponse, PaginationRequest } from 'src/models/pagination.model';
import { Paging } from 'src/models/web.model';

@Injectable()
export class OrderService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(userId: number, payload: CreateOrderRequest) {
    this.loggerService.info('ORDER', 'SERVICE', 'Creating order initiated', {
      userId,
      payload,
    });

    // 1. Validate all products and check stocks
    const itemsWithProducts: any[] = [];
    for (const item of payload.items) {
      const product = await this.prismaService.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        this.loggerService.warn(
          'ORDER',
          'SERVICE',
          'Product not found for order creation',
          {
            productId: item.productId,
          },
        );
        throw new NotFoundException(
          `Product not found with ID: ${item.productId}`,
        );
      }

      if (product.stock < item.quantity) {
        this.loggerService.warn(
          'ORDER',
          'SERVICE',
          'Insufficient product stock',
          {
            productId: item.productId,
            stock: product.stock,
            requested: item.quantity,
          },
        );
        throw new BadRequestException(
          `Insufficient stock for product: ${product.name}`,
        );
      }

      itemsWithProducts.push({
        ...item,
        price: product.price,
      });
    }

    // 2. Calculate totalPrice
    let totalPrice = 0;
    for (const item of itemsWithProducts) {
      totalPrice += Number(item.price) * item.quantity;
    }

    // 3. Create Order and OrderItems, and update stock in a transaction
    const order = await this.prismaService.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalPrice,
          deliveryMethod: payload.deliveryMethod,
          paymentMethod: payload.paymentMethod,
          status: 'PENDING',
        },
      });

      for (const item of itemsWithProducts) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            priceEach: item.price,
            note: item.note,
          },
        });

        const updatedProduct = await tx.product.updateMany({
          where: { 
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedProduct.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for product id: ${item.productId}`,
          );
        }
      }

      return newOrder;
    });

    // 4. Return order with items
    const result = await this.prismaService.order.findUnique({
      where: { id: order.id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    this.loggerService.info('ORDER', 'SERVICE', 'Order created successfully', {
      id: order.id,
    });
    return result;
  }

  async getStats() {
    this.loggerService.info('ORDER', 'SERVICE', 'Fetching order stats initiated');

    const revenueAggregation = await this.prismaService.order.aggregate({
      where: { status: { in: ['COMPLETED', 'PAID'] } },
      _sum: { totalPrice: true },
    });
    const totalRevenue = Number(revenueAggregation._sum.totalPrice || 0);

    const activeOrders = await this.prismaService.order.count({
      where: { status: { in: ['PENDING', 'PROCESSING', 'DELIVERING'] } },
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const recentOrders = await this.prismaService.order.findMany({
      where: {
        status: { in: ['COMPLETED', 'PAID'] },
        createdAt: { gte: sixMonthsAgo },
      },
      select: { totalPrice: true, createdAt: true },
    });

    const monthlyRevenueMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthYear = `${d.toLocaleString('id-ID', { month: 'long' })} ${d.getFullYear()}`;
      monthlyRevenueMap.set(monthYear, 0);
    }

    recentOrders.forEach((order) => {
      const d = new Date(order.createdAt);
      const monthYear = `${d.toLocaleString('id-ID', { month: 'long' })} ${d.getFullYear()}`;
      if (monthlyRevenueMap.has(monthYear)) {
        monthlyRevenueMap.set(monthYear, monthlyRevenueMap.get(monthYear)! + Number(order.totalPrice));
      }
    });

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    const recent5Orders = await this.prismaService.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return {
      totalRevenue,
      activeOrders,
      monthlyRevenue,
      recentOrders: recent5Orders,
    };
  }

  async findAll(userId: number, role: string, request: PaginationRequest): Promise<PaginatedResponse<Order>> {
    this.loggerService.info('ORDER', 'SERVICE', 'Fetching orders initiated', {
      userId,
      role,
      request,
    });

    const isAdmin = role === 'ADMIN';
    const where: Prisma.OrderWhereInput = isAdmin ? {} : { userId };

    const skip = (request.page - 1) * request.size;

    // Filter - Search bisa dicari dari user name atau status, tapi Order tdk punya name.
    // Kita abaikan search atau cari by status jika string persis
    if (request.search) {
      if (['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELED'].includes(request.search.toUpperCase())) {
         where.status = request.search.toUpperCase() as any;
      }
    }

    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    if (request.sortBy) {
      orderBy[request.sortBy] = request.sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [totalData, orders] = await this.prismaService.$transaction([
      this.prismaService.order.count({ where }),
      this.prismaService.order.findMany({
        where,
        skip,
        take: request.size,
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payment: true,
        },
        orderBy,
      }),
    ]);

    this.loggerService.info('ORDER', 'SERVICE', 'Orders fetched successfully', {
      count: orders.length,
      totalData,
    });

    return {
      data: orders as any, // Cast if needed for return type match
      paging: new Paging({
        size: request.size,
        totalData,
        totalPage: Math.ceil(totalData / request.size),
        currentPage: request.page,
      }),
    };
  }

  async findById(id: number, userId: number, role: string) {
    this.loggerService.info(
      'ORDER',
      'SERVICE',
      'Fetching order by ID initiated',
      { id, userId, role },
    );

    const order = await this.prismaService.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      this.loggerService.warn('ORDER', 'SERVICE', 'Order not found', { id });
      throw new NotFoundException('Order not found');
    }

    const isAdmin = role === 'ADMIN';
    if (!isAdmin && order.userId !== userId) {
      this.loggerService.warn(
        'ORDER',
        'SERVICE',
        'Unauthorized access to order',
        { id, userId },
      );
      throw new ForbiddenException('You are not authorized to view this order');
    }

    this.loggerService.info('ORDER', 'SERVICE', 'Order fetched successfully', {
      id,
    });
    return order;
  }

  async update(
    id: number,
    userId: number,
    role: string,
    payload: UpdateOrderRequest,
  ) {
    this.loggerService.info('ORDER', 'SERVICE', 'Updating order initiated', {
      id,
      userId,
      role,
      payload,
    });

    const order = await this.findById(id, userId, role);
    const isAdmin = role === 'ADMIN';

    if (!isAdmin) {
      // User can only cancel PENDING orders
      if (
        payload.deliveryMethod !== undefined ||
        payload.paymentMethod !== undefined
      ) {
        throw new ForbiddenException(
          'You are not allowed to update delivery or payment method',
        );
      }
      if (payload.status !== 'CANCELED') {
        throw new ForbiddenException(
          'You are only allowed to cancel your order',
        );
      }
      if (order.status !== 'PENDING') {
        throw new BadRequestException('Only pending orders can be canceled');
      }
    }

    const shouldRestoreStock =
      payload.status === 'CANCELED' && order.status !== 'CANCELED';

    const updatedOrder = await this.prismaService.$transaction(async (tx) => {
      if (shouldRestoreStock) {
        for (const item of order.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          status: payload.status,
          deliveryMethod: payload.deliveryMethod,
          paymentMethod: payload.paymentMethod,
        },
      });
    });

    const result = await this.prismaService.order.findUnique({
      where: { id: updatedOrder.id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.loggerService.info('ORDER', 'SERVICE', 'Order updated successfully', {
      id,
    });
    return result;
  }

  async remove(id: number) {
    this.loggerService.info('ORDER', 'SERVICE', 'Deleting order initiated', {
      id,
    });

    // Verify exists
    const order = await this.prismaService.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const deleted = await this.prismaService.order.delete({
      where: { id },
    });

    this.loggerService.info('ORDER', 'SERVICE', 'Order deleted successfully', {
      id,
    });
    return deleted;
  }
}
