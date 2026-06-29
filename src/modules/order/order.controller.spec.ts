import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { Prisma, User } from 'src/generated/prisma/client';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;
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

  const mockOrder = {
    id: 1,
    userId: 2,
    totalPrice: new Prisma.Decimal(50.0),
    status: 'PENDING' as const,
    deliveryMethod: 'DELIVERY' as const,
    paymentMethod: 'TRANSFER' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    orderItems: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockOrder),
            findAll: jest.fn().mockResolvedValue({
              data: [mockOrder],
              paging: { currentPage: 1, totalPage: 1, totalData: 1, size: 10 }
            }),
            findById: jest.fn().mockResolvedValue(mockOrder),
            update: jest.fn().mockResolvedValue(mockOrder),
            remove: jest.fn().mockResolvedValue(mockOrder),
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

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
    responseService = module.get<ResponseService>(ResponseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call OrderService.create and return success response', async () => {
      const payload = {
        deliveryMethod: 'DELIVERY' as const,
        paymentMethod: 'TRANSFER' as const,
        items: [{ productId: 1, quantity: 2, note: null }],
      };
      const response = await controller.create(mockUser, payload);

      expect(service.create).toHaveBeenCalledWith(mockUser.id, payload);
      expect(responseService.success).toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockOrder);
    });
  });

  describe('findAll', () => {
    it('should return list of orders', async () => {
      const request = { page: 1, size: 10 };
      const response = await controller.findAll(mockUser, request);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, mockUser.role, request);
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return order details', async () => {
      const response = await controller.findById(mockUser, 1);

      expect(service.findById).toHaveBeenCalledWith(
        1,
        mockUser.id,
        mockUser.role,
      );
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockOrder);
    });
  });

  describe('update', () => {
    it('should call OrderService.update and return updated order', async () => {
      const payload = { status: 'CANCELED' as const };
      const response = await controller.update(mockUser, 1, payload);

      expect(service.update).toHaveBeenCalledWith(
        1,
        mockUser.id,
        mockUser.role,
        payload,
      );
      expect(response.success).toBe(true);
    });
  });

  describe('remove', () => {
    it('should call OrderService.remove and return deleted order', async () => {
      const response = await controller.remove(mockUser, 1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(response.success).toBe(true);
    });
  });
});
