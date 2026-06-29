import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { Prisma, Image } from 'src/generated/prisma/client';
import { PaginatedResponse, PaginationRequest } from 'src/models/pagination.model';
import { Paging } from 'src/models/web.model';

@Injectable()
export class ImageService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(productId: number, files: Express.Multer.File[]) {
    this.loggerService.info('IMAGE', 'SERVICE', 'Creating images initiated', {
      productId,
      filesCount: files?.length,
    });

    // 1. Verify product exists
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      this.loggerService.warn(
        'IMAGE',
        'SERVICE',
        'Product not found for image creation',
        { productId },
      );
      throw new NotFoundException(`Product not found with ID: ${productId}`);
    }

    if (!files || files.length === 0) {
      this.loggerService.warn(
        'IMAGE',
        'SERVICE',
        'No files provided for image upload',
        { productId },
      );
      throw new BadRequestException('At least one image file is required.');
    }

    // 2. Upload each file to Cloudinary and create in Database
    const createdImages: any[] = [];
    for (const file of files) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        const image = await this.prismaService.image.create({
          data: {
            productId,
            publicId: uploadResult.public_id,
            urls: uploadResult.secure_url,
          },
        });
        createdImages.push(image);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        this.loggerService.error(
          'IMAGE',
          'SERVICE',
          'Failed to upload/save image',
          {
            error: errorMessage,
            productId,
          },
        );
        throw new BadRequestException(
          `Failed to upload image: ${errorMessage}`,
        );
      }
    }

    this.loggerService.info('IMAGE', 'SERVICE', 'Images created successfully', {
      count: createdImages.length,
      productId,
    });
    return createdImages;
  }

  async findAll(request: PaginationRequest): Promise<PaginatedResponse<Image>> {
    this.loggerService.info('IMAGE', 'SERVICE', 'Fetching all images', { request });

    const skip = (request.page - 1) * request.size;

    const where: Prisma.ImageWhereInput = {};
    if (request.search) {
      where.urls = {
        contains: request.search,
        mode: 'insensitive',
      };
    }

    const orderBy: Prisma.ImageOrderByWithRelationInput = {};
    if (request.sortBy) {
      orderBy[request.sortBy] = request.sortOrder;
    } else {
      orderBy.id = 'desc';
    }

    const [totalData, images] = await this.prismaService.$transaction([
      this.prismaService.image.count({ where }),
      this.prismaService.image.findMany({
        where,
        skip,
        take: request.size,
        orderBy,
      }),
    ]);

    this.loggerService.info('IMAGE', 'SERVICE', 'Images fetched successfully', {
      count: images.length,
      totalData,
    });

    return {
      data: images,
      paging: new Paging({
        size: request.size,
        totalData,
        totalPage: Math.ceil(totalData / request.size),
        currentPage: request.page,
      }),
    };
  }

  async findById(id: number) {
    this.loggerService.info('IMAGE', 'SERVICE', 'Fetching image by ID', { id });
    const image = await this.prismaService.image.findUnique({
      where: { id },
    });
    if (!image) {
      this.loggerService.warn('IMAGE', 'SERVICE', 'Image not found', { id });
      throw new NotFoundException(`Image not found with ID: ${id}`);
    }
    return image;
  }

  async update(ids: number[], files: Express.Multer.File[]) {
    this.loggerService.info('IMAGE', 'SERVICE', 'Updating images initiated', {
      ids,
      filesCount: files?.length,
    });

    if (!files || files.length === 0) {
      throw new BadRequestException(
        'At least one image file is required for updating.',
      );
    }
    if (ids.length !== files.length) {
      throw new BadRequestException(
        'The number of image IDs must match the number of files provided.',
      );
    }

    // 1. Verify all image IDs exist
    const existingImages = await this.prismaService.image.findMany({
      where: { id: { in: ids } },
    });
    if (existingImages.length !== ids.length) {
      const missingIds = ids.filter(
        (id) => !existingImages.some((img) => img.id === id),
      );
      this.loggerService.warn(
        'IMAGE',
        'SERVICE',
        'Some image IDs not found for update',
        { missingIds },
      );
      throw new NotFoundException(
        `Image(s) not found with ID(s): ${missingIds.join(', ')}`,
      );
    }

    // Map existing images by ID for easy lookup matching the array order
    const imageMap = new Map(existingImages.map((img) => [img.id, img]));

    const updatedImages: any[] = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const file = files[i];
      const existingImage = imageMap.get(id);
      if (!existingImage) continue;

      try {
        // Destroy old file in Cloudinary
        await this.cloudinaryService.destroyFile(existingImage.publicId);

        // Upload new file
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        const updatedImage = await this.prismaService.image.update({
          where: { id },
          data: {
            publicId: uploadResult.public_id,
            urls: uploadResult.secure_url,
          },
        });
        updatedImages.push(updatedImage);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        this.loggerService.error('IMAGE', 'SERVICE', 'Failed to update image', {
          error: errorMessage,
          id,
        });
        throw new BadRequestException(
          `Failed to update image ID ${id}: ${errorMessage}`,
        );
      }
    }

    this.loggerService.info('IMAGE', 'SERVICE', 'Images updated successfully', {
      count: updatedImages.length,
    });
    return updatedImages;
  }

  async remove(ids: number[]) {
    this.loggerService.info('IMAGE', 'SERVICE', 'Deleting images initiated', {
      ids,
    });

    // 1. Verify all image IDs exist
    const existingImages = await this.prismaService.image.findMany({
      where: { id: { in: ids } },
    });
    if (existingImages.length !== ids.length) {
      const missingIds = ids.filter(
        (id) => !existingImages.some((img) => img.id === id),
      );
      this.loggerService.warn(
        'IMAGE',
        'SERVICE',
        'Some image IDs not found for deletion',
        { missingIds },
      );
      throw new NotFoundException(
        `Image(s) not found with ID(s): ${missingIds.join(', ')}`,
      );
    }

    // 2. Destroy in Cloudinary
    for (const image of existingImages) {
      try {
        await this.cloudinaryService.destroyFile(image.publicId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        this.loggerService.warn(
          'IMAGE',
          'SERVICE',
          'Failed to delete image from Cloudinary',
          {
            publicId: image.publicId,
            error: errorMessage,
          },
        );
      }
    }

    // 3. Delete from DB
    await this.prismaService.image.deleteMany({
      where: { id: { in: ids } },
    });

    this.loggerService.info('IMAGE', 'SERVICE', 'Images deleted successfully', {
      ids,
    });
    return existingImages;
  }
}
