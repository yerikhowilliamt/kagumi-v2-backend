import { Test, TestingModule } from '@nestjs/testing';
import { OrderItemService } from './order-item.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';

describe('OrderItemService', () => {
  let service: OrderItemService;
  let prismaService: PrismaService;
  let cloudinaryService: CloudinaryService;

  const mockProduct = {
    id: 1,
    categoryId: 1,
    name: 'Cake',
    description: 'Yummy cake',
    price: new Prisma.Decimal(15000),
    type: 'REGULAR' as const,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: 50,
    userId: 2,
    totalPrice: new Prisma.Decimal(30000),
    status: 'PENDING' as const,
    deliveryMethod: 'DELIVERY' as const,
    paymentMethod: 'TRANSFER' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderItem = {
    id: 90,
    orderId: 50,
    productId: 1,
    quantity: 2,
    note: 'Tanpa lilin',
    priceEach: new Prisma.Decimal(15000),
    createdAt: new Date(),
    updatedAt: new Date(),
    product: mockProduct,
    order: mockOrder,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderItemService,
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
          provide: CloudinaryService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue({
              secure_url: 'https://cloudinary.com/img.jpg',
              public_id: 'img123',
            }),
            destroyFile: jest.fn().mockResolvedValue({ result: 'ok' }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(async (callback: any) => {
              if (Array.isArray(callback)) {
                return Promise.all(callback);
              }
              return callback(prismaService);
            }),
            product: {
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            order: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            orderItem: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrderItemService>(OrderItemService);
    prismaService = module.get<PrismaService>(PrismaService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if order is not found', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create(2, 'USER', {
          orderId: 999,
          productId: 1,
          quantity: 1,
          priceEach: 15000,
          note: null,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if order belongs to other user and requester is not admin', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);

      await expect(
        service.create(99, 'USER', {
          orderId: 50,
          productId: 1,
          quantity: 1,
          priceEach: 15000,
          note: null,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if product is not found', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create(2, 'USER', {
          orderId: 50,
          productId: 999,
          quantity: 1,
          priceEach: 15000,
          note: null,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(mockProduct as any);

      await expect(
        service.create(2, 'USER', {
          orderId: 50,
          productId: 1,
          quantity: 50,
          priceEach: 15000,
          note: null,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create order item and recalculate total price', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(mockProduct as any);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
        if (Array.isArray(callback)) {
          return Promise.all(callback);
        }
        return callback(prismaService);
      });
      jest.spyOn(prismaService.orderItem, 'create').mockResolvedValue(mockOrderItem as any);
      jest.spyOn(prismaService.product, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.product, 'updateMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prismaService.orderItem, 'findMany').mockResolvedValue([mockOrderItem] as any);
      jest.spyOn(prismaService.order, 'update').mockResolvedValue({} as any);

      const result = await service.create(2, 'USER', {
        orderId: 50,
        productId: 1,
        quantity: 2,
        priceEach: 15000,
        note: 'Tanpa lilin',
      });

      expect(result.id).toBe(90);
      expect(prismaService.orderItem.create).toHaveBeenCalled();
      expect(prismaService.order.update).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should filter items by user orders if role is USER', async () => {
      jest.spyOn(prismaService.orderItem, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.orderItem, 'findMany').mockResolvedValue([mockOrderItem] as any);

      const result = await service.findAll(2, 'USER', { page: 1, size: 10 });
      expect(result.data).toHaveLength(1);
      expect(prismaService.orderItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { order: { userId: 2 } },
        }),
      );
    });

    it('should not filter items if role is ADMIN', async () => {
      jest.spyOn(prismaService.orderItem, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.orderItem, 'findMany').mockResolvedValue([mockOrderItem] as any);

      const result = await service.findAll(1, 'ADMIN', { page: 1, size: 10 });
      expect(result.data).toHaveLength(1);
      expect(prismaService.orderItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if item does not exist', async () => {
      jest.spyOn(prismaService.orderItem, 'findUnique').mockResolvedValue(null);

      await expect(service.findById(999, 2, 'USER')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if item belongs to other user order and requester is USER', async () => {
      jest.spyOn(prismaService.orderItem, 'findUnique').mockResolvedValue(mockOrderItem as any);

      await expect(service.findById(90, 99, 'USER')).rejects.toThrow(ForbiddenException);
    });

    it('should return item for owner user', async () => {
      jest.spyOn(prismaService.orderItem, 'findUnique').mockResolvedValue(mockOrderItem as any);

      const result = await service.findById(90, 2, 'USER');
      expect(result.id).toBe(90);
    });

    it('should return item for admin regardless of owner', async () => {
      jest.spyOn(prismaService.orderItem, 'findUnique').mockResolvedValue(mockOrderItem as any);

      const result = await service.findById(90, 99, 'ADMIN');
      expect(result.id).toBe(90);
    });
  });

  describe('update', () => {
    it('should successfully update item quantity, adjust stocks and recalculate total price', async () => {
      jest.spyOn(prismaService.orderItem, 'findUnique').mockResolvedValue(mockOrderItem as any);
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(mockProduct as any);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
        if (Array.isArray(callback)) {
          return Promise.all(callback);
        }
        return callback(prismaService);
      });
      jest.spyOn(prismaService.product, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.product, 'updateMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prismaService.orderItem, 'update').mockResolvedValue({ ...mockOrderItem, quantity: 3 } as any);
      jest.spyOn(prismaService.orderItem, 'findMany').mockResolvedValue([mockOrderItem] as any);
      jest.spyOn(prismaService.order, 'update').mockResolvedValue({} as any);

      const result = await service.update(90, { quantity: 3 });
      expect(result.quantity).toBe(3);
      expect(prismaService.product.update).toHaveBeenCalledTimes(1); // Increments old qty
      expect(prismaService.product.updateMany).toHaveBeenCalledTimes(1); // Decrements new qty
    });
  });

  describe('remove', () => {
    it('should successfully remove item, restore stock and recalculate total price', async () => {
      jest.spyOn(prismaService.orderItem, 'findUnique').mockResolvedValue(mockOrderItem as any);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
        if (Array.isArray(callback)) {
          return Promise.all(callback);
        }
        return callback(prismaService);
      });
      jest.spyOn(prismaService.product, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.orderItem, 'delete').mockResolvedValue(mockOrderItem as any);
      jest.spyOn(prismaService.orderItem, 'findMany').mockResolvedValue([] as any);
      jest.spyOn(prismaService.order, 'update').mockResolvedValue({} as any);

      const result = await service.remove(90);
      expect(result.id).toBe(90);
      expect(prismaService.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { stock: { increment: 2 } },
        }),
      );
      expect(prismaService.order.update).toHaveBeenCalled();
    });
  });
});
