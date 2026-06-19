import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';

describe('ProductService', () => {
  let service: ProductService;
  let prismaService: PrismaService;

  const mockCategory = {
    id: 1,
    name: 'Electronics',
    description: 'Electronic items',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 1,
    categoryId: 1,
    name: 'Smartphone',
    description: 'Latest model smartphone',
    price: new Prisma.Decimal(999.99),
    type: 'REGULAR' as const,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
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
            category: {
              findUnique: jest.fn(),
            },
            product: {
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

    service = module.get<ProductService>(ProductService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if category does not exist', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create({
          categoryId: 99,
          name: 'Smartphone',
          description: 'desc',
          price: 999.99,
          type: 'REGULAR',
          stock: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a product successfully', async () => {
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(mockCategory);
      jest
        .spyOn(prismaService.product, 'create')
        .mockResolvedValue(mockProduct);

      const result = await service.create({
        categoryId: 1,
        name: 'Smartphone',
        description: 'Latest model smartphone',
        price: 999.99,
        type: 'REGULAR',
        stock: 10,
      });

      expect(result.id).toBe(1);
      expect(result.name).toBe('Smartphone');
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      jest
        .spyOn(prismaService.product, 'findMany')
        .mockResolvedValue([mockProduct]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Smartphone');
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });

    it('should return product if found', async () => {
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct);

      const result = await service.findById(1);
      expect(result.name).toBe('Smartphone');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if product does not exist', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update(99, {
          name: 'Updated Name',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if updating to a non-existent category', async () => {
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct);
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update(1, {
          categoryId: 99,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update product successfully', async () => {
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct);
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(mockCategory);
      jest.spyOn(prismaService.product, 'update').mockResolvedValue({
        ...mockProduct,
        name: 'Updated Name',
      });

      const result = await service.update(1, {
        name: 'Updated Name',
        categoryId: 1,
      });

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if product does not exist', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('should delete product successfully', async () => {
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct);
      jest
        .spyOn(prismaService.product, 'delete')
        .mockResolvedValue(mockProduct);

      const result = await service.remove(1);
      expect(result.id).toBe(1);
    });
  });
});
