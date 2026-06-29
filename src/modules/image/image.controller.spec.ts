/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { BadRequestException } from '@nestjs/common';

describe('ImageController', () => {
  let controller: ImageController;
  let service: ImageService;

  const mockImage = {
    id: 1,
    productId: 1,
    publicId: 'folder/img1',
    urls: 'https://cloudinary.com/folder/img1.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFile = {
    fieldname: 'image',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('mock buffer'),
    size: 11,
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageController],
      providers: [
        {
          provide: ImageService,
          useValue: {
            create: jest.fn().mockResolvedValue([mockImage]),
            findAll: jest.fn().mockResolvedValue({
              data: [mockImage],
              paging: { currentPage: 1, totalPage: 1, totalData: 1, size: 10 }
            }),
            findById: jest.fn().mockResolvedValue(mockImage),
            update: jest.fn().mockResolvedValue([mockImage]),
            remove: jest.fn().mockResolvedValue([mockImage]),
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

    controller = module.get<ImageController>(ImageController);
    service = module.get<ImageService>(ImageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if no files are provided', async () => {
      await expect(
        controller.create({ productId: 1 }, { image: [], images: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call ImageService.create and return success response', async () => {
      const response = await controller.create(
        { productId: 1 },
        { image: [mockFile] },
      );
      expect(service.create).toHaveBeenCalledWith(1, [mockFile]);
      expect(response.success).toBe(true);
      expect(response.data).toEqual([mockImage]);
    });
  });

  describe('findAll', () => {
    it('should return all images', async () => {
      const request = { page: 1, size: 10 };
      const response = await controller.findAll(request);
      expect(service.findAll).toHaveBeenCalledWith(request);
      expect(response.success).toBe(true);
      expect(response.data).toEqual([mockImage]);
    });
  });

  describe('findById', () => {
    it('should return single image', async () => {
      const response = await controller.findById(1);
      expect(service.findById).toHaveBeenCalledWith(1);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockImage);
    });
  });

  describe('update', () => {
    it('should throw BadRequestException if no files provided', async () => {
      await expect(controller.update('1', { image: [] })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should parse comma-separated IDs and call update', async () => {
      const response = await controller.update('1,2', {
        images: [mockFile, mockFile],
      });
      expect(service.update).toHaveBeenCalledWith([1, 2], [mockFile, mockFile]);
      expect(response.success).toBe(true);
    });
  });

  describe('remove', () => {
    it('should call remove with parsed IDs', async () => {
      const response = await controller.remove('1,2');
      expect(service.remove).toHaveBeenCalledWith([1, 2]);
      expect(response.success).toBe(true);
    });
  });
});
