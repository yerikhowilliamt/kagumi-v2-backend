import { Test, TestingModule } from '@nestjs/testing';
import { CustomOrderOptionService } from './custom-order-option.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CustomOrderOptionService', () => {
  let service: CustomOrderOptionService;
  let prismaService: PrismaService;

  const mockProduct = {
    id: 1,
    categoryId: 1,
    name: 'Custom Cake',
    description: 'A premium custom cake',
    price: 150000,
    type: 'CUSTOM',
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOption = {
    id: 10,
    productId: 1,
    label: 'Lilin Angka',
    placeholder: 'Tulis angka lilin (misal: 25)',
    required: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: mockProduct,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomOrderOptionService,
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
            product: {
              findUnique: jest.fn(),
            },
            customOrderOption: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            $transaction: jest.fn((callback) => {
              if (Array.isArray(callback)) {
                return Promise.all(callback);
              }
              return callback();
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CustomOrderOptionService>(CustomOrderOptionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if product is not found', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create({
          productId: 999,
          label: 'Option A',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should successfully create custom order option', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(mockProduct as any);
      jest.spyOn(prismaService.customOrderOption, 'create').mockResolvedValue(mockOption as any);

      const result = await service.create({
        productId: 1,
        label: 'Lilin Angka',
        placeholder: 'Tulis angka lilin (misal: 25)',
        required: false,
      });

      expect(result.id).toBe(10);
      expect(prismaService.customOrderOption.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should fetch all custom order options', async () => {
      jest.spyOn(prismaService.customOrderOption, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.customOrderOption, 'findMany').mockResolvedValue([mockOption] as any);

      const result = await service.findAll({ page: 1, size: 10 });
      expect(result.data).toHaveLength(1);
      expect(prismaService.customOrderOption.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if option not found', async () => {
      jest.spyOn(prismaService.customOrderOption, 'findUnique').mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('should return option if found', async () => {
      jest.spyOn(prismaService.customOrderOption, 'findUnique').mockResolvedValue(mockOption as any);

      const result = await service.findById(10);
      expect(result.id).toBe(10);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if option to update is not found', async () => {
      jest.spyOn(prismaService.customOrderOption, 'findUnique').mockResolvedValue(null);

      await expect(service.update(999, { label: 'New Label' })).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if new productId is not found', async () => {
      jest.spyOn(prismaService.customOrderOption, 'findUnique').mockResolvedValue(mockOption as any);
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      await expect(service.update(10, { productId: 999 })).rejects.toThrow(NotFoundException);
    });

    it('should successfully update custom order option', async () => {
      jest.spyOn(prismaService.customOrderOption, 'findUnique').mockResolvedValue(mockOption as any);
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(mockProduct as any);
      jest.spyOn(prismaService.customOrderOption, 'update').mockResolvedValue({
        ...mockOption,
        label: 'Updated Label',
      } as any);

      const result = await service.update(10, { label: 'Updated Label' });
      expect(result.label).toBe('Updated Label');
      expect(prismaService.customOrderOption.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if option to delete is not found', async () => {
      jest.spyOn(prismaService.customOrderOption, 'findUnique').mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should successfully delete custom order option', async () => {
      jest.spyOn(prismaService.customOrderOption, 'findUnique').mockResolvedValue(mockOption as any);
      jest.spyOn(prismaService.customOrderOption, 'delete').mockResolvedValue(mockOption as any);

      const result = await service.remove(10);
      expect(result.id).toBe(10);
      expect(prismaService.customOrderOption.delete).toHaveBeenCalled();
    });
  });
});
