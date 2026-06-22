import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';

describe('OrderService', () => {
  let service: OrderService;
  let prismaService: PrismaService;

  const mockProduct = {
    id: 1,
    categoryId: 1,
    name: 'Loaf of Bread',
    description: 'Fresh loaf',
    price: new Prisma.Decimal(25.0),
    type: 'REGULAR' as const,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: 1,
    userId: 2,
    totalPrice: new Prisma.Decimal(50.0),
    status: 'PENDING' as const,
    deliveryMethod: 'DELIVERY' as const,
    paymentMethod: 'TRANSFER' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    orderItems: [
      {
        id: 1,
        orderId: 1,
        productId: 1,
        quantity: 2,
        priceEach: new Prisma.Decimal(25.0),
        note: 'Fresh please',
        createdAt: new Date(),
        updatedAt: new Date(),
        product: mockProduct,
      },
    ],
    user: {
      id: 2,
      name: 'Normal User',
      email: 'user@mail.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: LoggerService,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            product: {
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            order: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            orderItem: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if product is not found', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create(2, {
          deliveryMethod: 'DELIVERY',
          paymentMethod: 'TRANSFER',
          items: [{ productId: 99, quantity: 1, note: null }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if product stock is insufficient', async () => {
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct);

      await expect(
        service.create(2, {
          deliveryMethod: 'DELIVERY',
          paymentMethod: 'TRANSFER',
          items: [{ productId: 1, quantity: 20, note: null }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create order successfully', async () => {
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (cb: any) => {
          return cb(prismaService);
        });
      jest
        .spyOn(prismaService.order, 'create')
        .mockResolvedValue({ id: 1 } as any);
      jest
        .spyOn(prismaService.orderItem, 'create')
        .mockResolvedValue({} as any);
      jest.spyOn(prismaService.product, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.product, 'updateMany').mockResolvedValue({ count: 1 } as any);
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder);

      const result = await service.create(2, {
        deliveryMethod: 'DELIVERY',
        paymentMethod: 'TRANSFER',
        items: [{ productId: 1, quantity: 2, note: 'Fresh please' }],
      });

      expect(result.id).toBe(1);
      expect(result.totalPrice.toString()).toBe('50');
      expect(prismaService.order.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all orders for admin', async () => {
      jest
        .spyOn(prismaService.order, 'findMany')
        .mockResolvedValue([mockOrder]);

      const result = await service.findAll(1, 'ADMIN');
      expect(result).toHaveLength(1);
      expect(prismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('should return user specific orders for user role', async () => {
      jest
        .spyOn(prismaService.order, 'findMany')
        .mockResolvedValue([mockOrder]);

      const result = await service.findAll(2, 'USER');
      expect(result).toHaveLength(1);
      expect(prismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 2 } }),
      );
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if order not found', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(null);

      await expect(service.findById(99, 2, 'USER')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if order belongs to another user and requester is not admin', async () => {
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder);

      await expect(service.findById(1, 99, 'USER')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return order for owner', async () => {
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder);

      const result = await service.findById(1, 2, 'USER');
      expect(result.id).toBe(1);
    });

    it('should return order for admin regardless of owner', async () => {
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder);

      const result = await service.findById(1, 99, 'ADMIN');
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should allow user to cancel pending order and restore stock', async () => {
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (cb: any) => {
          return cb(prismaService);
        });
      jest.spyOn(prismaService.product, 'update').mockResolvedValue({} as any);
      jest
        .spyOn(prismaService.order, 'update')
        .mockResolvedValue({ id: 1, status: 'CANCELED' } as any);

      const result = await service.update(1, 2, 'USER', { status: 'CANCELED' });
      expect(prismaService.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { stock: { increment: 2 } },
        }),
      );
    });

    it('should throw ForbiddenException if user tries to update delivery method', async () => {
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder);

      await expect(
        service.update(1, 2, 'USER', { deliveryMethod: 'COD' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user tries to update status to other than CANCELED', async () => {
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder);

      await expect(
        service.update(1, 2, 'USER', { status: 'PAID' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if user tries to cancel non-PENDING order', async () => {
      const paidOrder = { ...mockOrder, status: 'PAID' as const };
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(paidOrder);

      await expect(
        service.update(1, 2, 'USER', { status: 'CANCELED' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if order not found for deletion', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('should delete order successfully', async () => {
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder);
      jest.spyOn(prismaService.order, 'delete').mockResolvedValue(mockOrder);

      const result = await service.remove(1);
      expect(result.id).toBe(1);
    });
  });
});
