import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { Prisma, User } from 'src/generated/prisma/client';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;
  let responseService: ResponseService;

  const mockUser: User = {
    id: 2,
    publicId: null,
    name: 'Normal User',
    email: 'user@mail.com',
    emailVerified: null,
    phone: '+6281234567891',
    address: 'User Street',
    password: 'hashedpassword',
    refreshToken: null,
    imageUrl: null,
    role: 'USER',
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockPayment),
            findAll: jest.fn().mockResolvedValue({
              data: [mockPayment],
              paging: { currentPage: 1, totalPage: 1, totalData: 1, size: 10 }
            }),
            findById: jest.fn().mockResolvedValue(mockPayment),
            update: jest.fn().mockResolvedValue(mockPayment),
            remove: jest.fn().mockResolvedValue(mockPayment),
          },
        },
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
          provide: ResponseService,
          useValue: {
            success: jest.fn().mockImplementation((params) => ({
              success: true,
              data: params.data,
              status: params.status,
              message: params.message,
            })),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
    responseService = module.get<ResponseService>(ResponseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call PaymentService.create and return success response', async () => {
      const payload = {
        orderId: 1,
        transactionId: 'TX-12345',
        amount: 100,
        paymentMethod: 'TRANSFER' as const,
      };
      const response = await controller.create(mockUser, payload);

      expect(service.create).toHaveBeenCalledWith(mockUser.id, mockUser.role, payload);
      expect(responseService.success).toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockPayment);
    });
  });

  describe('findAll', () => {
    it('should return list of payments', async () => {
      const request = { page: 1, size: 10 };
      const response = await controller.findAll(mockUser, request);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, mockUser.role, request);
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return payment details', async () => {
      const response = await controller.findById(mockUser, 1);

      expect(service.findById).toHaveBeenCalledWith(1, mockUser.id, mockUser.role);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockPayment);
    });
  });

  describe('update', () => {
    it('should call PaymentService.update and return updated payment', async () => {
      const payload = { amount: 150 };
      const response = await controller.update(mockUser, 1, payload);

      expect(service.update).toHaveBeenCalledWith(1, mockUser.id, mockUser.role, payload);
      expect(response.success).toBe(true);
    });
  });

  describe('remove', () => {
    it('should call PaymentService.remove and return deleted payment', async () => {
      const response = await controller.remove(mockUser, 1);

      expect(service.remove).toHaveBeenCalledWith(1, mockUser.role);
      expect(response.success).toBe(true);
    });
  });
});
