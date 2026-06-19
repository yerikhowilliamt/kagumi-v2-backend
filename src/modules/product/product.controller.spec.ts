import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { Prisma } from 'src/generated/prisma/client';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;
  let responseService: ResponseService;

  const mockProduct = {
    id: 1,
    categoryId: 1,
    name: 'Smartphone',
    description: 'Latest smartphone model',
    price: new Prisma.Decimal(999.99),
    type: 'REGULAR' as const,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockProduct),
            findAll: jest.fn().mockResolvedValue([mockProduct]),
            findById: jest.fn().mockResolvedValue(mockProduct),
            update: jest.fn().mockResolvedValue(mockProduct),
            remove: jest.fn().mockResolvedValue(mockProduct),
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

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
    responseService = module.get<ResponseService>(ResponseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call ProductService.create and return formatted response', async () => {
      const payload = {
        categoryId: 1,
        name: 'Smartphone',
        description: 'Latest smartphone model',
        price: 999.99,
        type: 'REGULAR' as const,
        stock: 10,
      };
      const response = await controller.create(payload);

      expect(service.create).toHaveBeenCalledWith(payload);
      expect(responseService.success).toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return list of products', async () => {
      const response = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return product detail', async () => {
      const response = await controller.findById(1);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update product and return it', async () => {
      const payload = { name: 'Updated Smartphone' };
      const response = await controller.update(1, payload);

      expect(service.update).toHaveBeenCalledWith(1, payload);
      expect(response.success).toBe(true);
    });
  });

  describe('remove', () => {
    it('should delete product and return it', async () => {
      const response = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(response.success).toBe(true);
    });
  });
});
