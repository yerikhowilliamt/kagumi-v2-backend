/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ImageService } from './image.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';

describe('ImageService', () => {
  let service: ImageService;
  let prismaService: PrismaService;
  let cloudinaryService: CloudinaryService;

  const mockProduct = {
    id: 1,
    categoryId: 1,
    name: 'Product A',
    description: 'A great product',
    price: 100.0,
    type: 'REGULAR',
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
      providers: [
        ImageService,
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
            image: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
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
        {
          provide: CloudinaryService,
          useValue: {
            uploadFile: jest.fn(),
            destroyFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ImageService>(ImageService);
    prismaService = module.get<PrismaService>(PrismaService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if product is not found', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      await expect(service.create(999, [mockFile])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if files array is empty', async () => {
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct as any);

      await expect(service.create(1, [])).rejects.toThrow(BadRequestException);
    });

    it('should upload files and save them to the database', async () => {
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct as any);
      jest.spyOn(cloudinaryService, 'uploadFile').mockResolvedValue({
        public_id: 'folder/img1',
        secure_url: 'https://cloudinary.com/folder/img1.jpg',
      } as UploadApiResponse);
      jest.spyOn(prismaService.image, 'create').mockResolvedValue(mockImage);

      const result = await service.create(1, [mockFile]);

      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(prismaService.image.create).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockImage);
    });
  });

  describe('findAll', () => {
    it('should return all images', async () => {
      jest
        .spyOn(prismaService.image, 'count')
        .mockResolvedValue(1);
      jest
        .spyOn(prismaService.image, 'findMany')
        .mockResolvedValue([mockImage]);

      const result = await service.findAll({ page: 1, size: 10 });
      expect(result.data).toEqual([mockImage]);
    });
  });

  describe('findById', () => {
    it('should return the image if found', async () => {
      jest
        .spyOn(prismaService.image, 'findUnique')
        .mockResolvedValue(mockImage);

      const result = await service.findById(1);
      expect(result).toEqual(mockImage);
    });

    it('should throw NotFoundException if image is not found', async () => {
      jest.spyOn(prismaService.image, 'findUnique').mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should throw BadRequestException if files array is empty', async () => {
      await expect(service.update([1], [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if IDs and files length mismatch', async () => {
      await expect(service.update([1], [mockFile, mockFile])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if any of the image IDs are missing in database', async () => {
      jest.spyOn(prismaService.image, 'findMany').mockResolvedValue([]);

      await expect(service.update([1], [mockFile])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should destroy old images, upload new ones and update the database records', async () => {
      jest
        .spyOn(prismaService.image, 'findMany')
        .mockResolvedValue([mockImage]);
      jest
        .spyOn(cloudinaryService, 'destroyFile')
        .mockResolvedValue({ result: 'ok' });
      jest.spyOn(cloudinaryService, 'uploadFile').mockResolvedValue({
        public_id: 'folder/img1-updated',
        secure_url: 'https://cloudinary.com/folder/img1-updated.jpg',
      } as UploadApiResponse);
      jest.spyOn(prismaService.image, 'update').mockResolvedValue({
        ...mockImage,
        publicId: 'folder/img1-updated',
        urls: 'https://cloudinary.com/folder/img1-updated.jpg',
      });

      const result = await service.update([1], [mockFile]);

      expect(cloudinaryService.destroyFile).toHaveBeenCalledWith('folder/img1');
      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(prismaService.image.update).toHaveBeenCalled();
      expect(result[0].publicId).toBe('folder/img1-updated');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if any image IDs do not exist', async () => {
      jest.spyOn(prismaService.image, 'findMany').mockResolvedValue([]);

      await expect(service.remove([1])).rejects.toThrow(NotFoundException);
    });

    it('should delete from Cloudinary and database', async () => {
      jest
        .spyOn(prismaService.image, 'findMany')
        .mockResolvedValue([mockImage]);
      jest
        .spyOn(cloudinaryService, 'destroyFile')
        .mockResolvedValue({ result: 'ok' });
      jest
        .spyOn(prismaService.image, 'deleteMany')
        .mockResolvedValue({ count: 1 });

      const result = await service.remove([1]);

      expect(cloudinaryService.destroyFile).toHaveBeenCalledWith('folder/img1');
      expect(prismaService.image.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
      });
      expect(result).toEqual([mockImage]);
    });
  });
});
