import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: CategoryService;
  let responseService: ResponseService;

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
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockCategory),
            findAll: jest.fn().mockResolvedValue({
              data: [mockCategory],
              paging: { currentPage: 1, totalPage: 1, totalData: 1, size: 10 }
            }),
            findById: jest.fn().mockResolvedValue(mockCategory),
            update: jest.fn().mockResolvedValue(mockCategory),
            remove: jest.fn().mockResolvedValue(mockCategory),
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

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
    responseService = module.get<ResponseService>(ResponseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call CategoryService.create and return formatted response', async () => {
      const payload = {
        name: 'Electronics',
        description: 'Electronic devices',
      };
      const response = await controller.create(payload);

      expect(service.create).toHaveBeenCalledWith(payload);
      expect(responseService.success).toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockCategory);
    });
  });

  describe('findAll', () => {
    it('should return list of categories', async () => {
      const request = { page: 1, size: 10 };
      const response = await controller.findAll(request);

      expect(service.findAll).toHaveBeenCalledWith(request);
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return category detail', async () => {
      const response = await controller.findById(1);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockCategory);
    });
  });

  describe('update', () => {
    it('should update category and return it', async () => {
      const payload = { name: 'Updated name' };
      const response = await controller.update(1, payload);

      expect(service.update).toHaveBeenCalledWith(1, payload);
      expect(response.success).toBe(true);
    });
  });

  describe('remove', () => {
    it('should delete category and return it', async () => {
      const response = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(response.success).toBe(true);
    });
  });
});
