import { Test, TestingModule } from '@nestjs/testing';
import { CustomOrderOptionController } from './custom-order-option.controller';
import { CustomOrderOptionService } from './custom-order-option.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';

describe('CustomOrderOptionController', () => {
  let controller: CustomOrderOptionController;
  let service: CustomOrderOptionService;
  let responseService: ResponseService;

  const mockOption = {
    id: 10,
    productId: 1,
    label: 'Lilin Angka',
    placeholder: 'Tulis angka lilin (misal: 25)',
    required: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomOrderOptionController],
      providers: [
        {
          provide: CustomOrderOptionService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockOption),
            findAll: jest.fn().mockResolvedValue([mockOption]),
            findById: jest.fn().mockResolvedValue(mockOption),
            update: jest.fn().mockResolvedValue(mockOption),
            remove: jest.fn().mockResolvedValue(mockOption),
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

    controller = module.get<CustomOrderOptionController>(CustomOrderOptionController);
    service = module.get<CustomOrderOptionService>(CustomOrderOptionService);
    responseService = module.get<ResponseService>(ResponseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call CustomOrderOptionService.create and return success response', async () => {
      const payload = {
        productId: 1,
        label: 'Lilin Angka',
        placeholder: 'Tulis angka lilin (misal: 25)',
        required: false,
      };
      const response = await controller.create(payload);

      expect(service.create).toHaveBeenCalledWith(payload);
      expect(responseService.success).toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockOption);
    });
  });

  describe('findAll', () => {
    it('should return list of custom order options', async () => {
      const response = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return custom order option details', async () => {
      const response = await controller.findById(10);

      expect(service.findById).toHaveBeenCalledWith(10);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockOption);
    });
  });

  describe('update', () => {
    it('should call CustomOrderOptionService.update and return updated option', async () => {
      const payload = { label: 'Updated Label' };
      const response = await controller.update(10, payload);

      expect(service.update).toHaveBeenCalledWith(10, payload);
      expect(response.success).toBe(true);
    });
  });

  describe('remove', () => {
    it('should call CustomOrderOptionService.remove and return deleted option', async () => {
      const response = await controller.remove(10);

      expect(service.remove).toHaveBeenCalledWith(10);
      expect(response.success).toBe(true);
    });
  });
});
