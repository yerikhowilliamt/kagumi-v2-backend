import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CategoryService', () => {
  let service: CategoryService;
  let prismaService: PrismaService;

  const mockCategory = {
    id: 1,
    name: 'Electronics',
    description: 'Electronic devices',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
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

    service = module.get<CategoryService>(CategoryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if category name already exists', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(mockCategory);
      await expect(service.create({ name: 'Electronics', description: 'desc' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if parent category does not exist', async () => {
      jest.spyOn(prismaService.category, 'findUnique')
        .mockResolvedValueOnce(null) // for name
        .mockResolvedValueOnce(null); // for parentId

      await expect(service.create({ name: 'Laptops', description: 'desc', parentId: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create a category successfully', async () => {
      jest.spyOn(prismaService.category, 'findUnique')
        .mockResolvedValueOnce(null) // name
        .mockResolvedValueOnce(mockCategory); // parent
      jest.spyOn(prismaService.category, 'create').mockResolvedValue({ ...mockCategory, id: 2, parentId: 1, name: 'Laptops' });

      const result = await service.create({ name: 'Laptops', description: 'desc', parentId: 1 });
      expect(result.id).toBe(2);
      expect(result.parentId).toBe(1);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      jest.spyOn(prismaService.category, 'findMany').mockResolvedValue([mockCategory]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Electronics');
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if category not found', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });

    it('should return category if found', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(mockCategory);
      const result = await service.findById(1);
      expect(result.name).toBe('Electronics');
    });
  });

  describe('update', () => {
    it('should throw BadRequestException if category is its own parent', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(mockCategory);
      await expect(service.update(1, { parentId: 1 })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if name already exists in another category', async () => {
      jest.spyOn(prismaService.category, 'findUnique')
        .mockResolvedValueOnce(mockCategory) // for get existing category in findById
        .mockResolvedValueOnce({ ...mockCategory, id: 2, name: 'Gadgets' }); // for unique name check

      await expect(service.update(1, { name: 'Gadgets' })).rejects.toThrow(BadRequestException);
    });

    it('should update successfully', async () => {
      jest.spyOn(prismaService.category, 'findUnique')
        .mockResolvedValueOnce(mockCategory); // findById
      jest.spyOn(prismaService.category, 'update').mockResolvedValue({ ...mockCategory, name: 'Updated' });

      const result = await service.update(1, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if category does not exist', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if category has sub-categories', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue({
        ...mockCategory,
        children: [{}],
        products: [],
      } as any);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if category has products', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue({
        ...mockCategory,
        children: [],
        products: [{}],
      } as any);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('should delete category successfully', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue({
        ...mockCategory,
        children: [],
        products: [],
      } as any);
      jest.spyOn(prismaService.category, 'delete').mockResolvedValue(mockCategory);

      const result = await service.remove(1);
      expect(result.id).toBe(1);
    });
  });
});
