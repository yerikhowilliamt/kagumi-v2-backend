import { Test, TestingModule } from '@nestjs/testing';
import { OrderItemController } from './order-item.controller';
import { OrderItemService } from './order-item.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { Prisma, User } from 'src/generated/prisma/client';

describe('OrderItemController', () => {
  let controller: OrderItemController;
  let service: OrderItemService;
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

  const mockOrderItem = {
    id: 90,
    orderId: 50,
    productId: 1,
    quantity: 2,
    note: 'Tanpa lilin',
    priceEach: new Prisma.Decimal(15000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderItemController],
      providers: [
        {
          provide: OrderItemService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockOrderItem),
            findAll: jest.fn().mockResolvedValue([mockOrderItem]),
            findById: jest.fn().mockResolvedValue(mockOrderItem),
            update: jest.fn().mockResolvedValue(mockOrderItem),
            remove: jest.fn().mockResolvedValue(mockOrderItem),
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

    controller = module.get<OrderItemController>(OrderItemController);
    service = module.get<OrderItemService>(OrderItemService);
    responseService = module.get<ResponseService>(ResponseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call OrderItemService.create and return success response', async () => {
      const payload = {
        orderId: 50,
        productId: 1,
        quantity: 2,
        priceEach: 15000,
        note: 'Tanpa lilin',
      };
      const response = await controller.create(mockUser, payload, undefined);

      expect(service.create).toHaveBeenCalledWith(mockUser.id, mockUser.role, payload, undefined);
      expect(responseService.success).toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockOrderItem);
    });
  });

  describe('findAll', () => {
    it('should return list of order items', async () => {
      const response = await controller.findAll(mockUser);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, mockUser.role);
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return order item details', async () => {
      const response = await controller.findById(mockUser, 90);

      expect(service.findById).toHaveBeenCalledWith(90, mockUser.id, mockUser.role);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockOrderItem);
    });
  });

  describe('update', () => {
    it('should call OrderItemService.update and return updated item', async () => {
      const payload = { quantity: 5 };
      const response = await controller.update(90, payload, undefined);

      expect(service.update).toHaveBeenCalledWith(90, payload, undefined);
      expect(response.success).toBe(true);
    });
  });

  describe('remove', () => {
    it('should call OrderItemService.remove and return deleted item', async () => {
      const response = await controller.remove(90);

      expect(service.remove).toHaveBeenCalledWith(90);
      expect(response.success).toBe(true);
    });
  });
});
