import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaService: PrismaService;

  const mockOrder = {
    id: 1,
    userId: 2,
    totalPrice: new Prisma.Decimal(100.00),
    status: 'PENDING' as const,
    deliveryMethod: 'DELIVERY' as const,
    paymentMethod: 'TRANSFER' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayment = {
    id: 1,
    orderId: 1,
    userId: 2,
    transactionId: 'TX-12345',
    amount: new Prisma.Decimal(100.00),
    paymentMethod: 'TRANSFER' as const,
    status: 'PENDING' as const,
    paymentProof: null,
    metadata: null,
    failureReason: null,
    refundAmount: null,
    refundedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: mockOrder,
    user: {
      id: 2,
      name: 'Normal User',
      email: 'user@mail.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
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
            order: {
              findUnique: jest.fn(),
            },
            payment: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if order is not found', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create(2, 'USER', {
          orderId: 99,
          transactionId: 'TX-99',
          amount: 100,
          paymentMethod: 'TRANSFER',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if order belongs to another user and requester is not admin', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);

      await expect(
        service.create(99, 'USER', {
          orderId: 1,
          transactionId: 'TX-123',
          amount: 100,
          paymentMethod: 'TRANSFER',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create payment successfully for order owner', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(prismaService.payment, 'create').mockResolvedValue(mockPayment as any);

      const result = await service.create(2, 'USER', {
        orderId: 1,
        transactionId: 'TX-12345',
        amount: 100,
        paymentMethod: 'TRANSFER',
      });

      expect(result.id).toBe(1);
      expect(prismaService.payment.create).toHaveBeenCalled();
    });

    it('should create payment successfully for admin even if order belongs to another user', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(prismaService.payment, 'create').mockResolvedValue(mockPayment as any);

      const result = await service.create(99, 'ADMIN', {
        orderId: 1,
        transactionId: 'TX-12345',
        amount: 100,
        paymentMethod: 'TRANSFER',
      });

      expect(result.id).toBe(1);
    });
  });

  describe('findAll', () => {
    it('should return all payments for admin', async () => {
      jest.spyOn(prismaService.payment, 'findMany').mockResolvedValue([mockPayment] as any);

      const result = await service.findAll(99, 'ADMIN');
      expect(result).toHaveLength(1);
      expect(prismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('should return user specific payments for user', async () => {
      jest.spyOn(prismaService.payment, 'findMany').mockResolvedValue([mockPayment] as any);

      const result = await service.findAll(2, 'USER');
      expect(result).toHaveLength(1);
      expect(prismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 2 } }),
      );
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if payment not found', async () => {
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(null);

      await expect(service.findById(99, 2, 'USER')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if payment belongs to another user and requester is not admin', async () => {
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(mockPayment as any);

      await expect(service.findById(1, 99, 'USER')).rejects.toThrow(ForbiddenException);
    });

    it('should return payment for owner', async () => {
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(mockPayment as any);

      const result = await service.findById(1, 2, 'USER');
      expect(result.id).toBe(1);
    });

    it('should return payment for admin', async () => {
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(mockPayment as any);

      const result = await service.findById(1, 99, 'ADMIN');
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if updater is not admin', async () => {
      await expect(
        service.update(1, 2, 'USER', { amount: 150 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if payment not found', async () => {
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update(99, 99, 'ADMIN', { amount: 150 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update payment successfully for admin', async () => {
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(mockPayment as any);
      jest.spyOn(prismaService.payment, 'update').mockResolvedValue({ ...mockPayment, amount: new Prisma.Decimal(150.00) } as any);

      const result = await service.update(1, 99, 'ADMIN', { amount: 150 });
      expect(result.amount.toString()).toBe('150');
      expect(prismaService.payment.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException if requester is not admin', async () => {
      await expect(service.remove(1, 'USER')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if payment not found', async () => {
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(null);

      await expect(service.remove(99, 'ADMIN')).rejects.toThrow(NotFoundException);
    });

    it('should delete payment successfully for admin', async () => {
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(mockPayment as any);
      jest.spyOn(prismaService.payment, 'delete').mockResolvedValue(mockPayment as any);

      const result = await service.remove(1, 'ADMIN');
      expect(result.id).toBe(1);
      expect(prismaService.payment.delete).toHaveBeenCalled();
    });
  });
});
