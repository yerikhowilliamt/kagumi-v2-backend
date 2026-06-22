import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { ZodBody } from 'src/common/validation/validation.decorator';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { CreateImageRequest } from './dto/create-image.dto';
import { generateMessage } from 'src/common/utils/message.util';
import WebResponse from 'src/models/web.model';
import { ImageValidation } from './image.validation';

@ApiTags('Images')
@Controller('images')
@UseGuards(JwtAccessAuthGuard)
export class ImageController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly imageService: ImageService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }, { name: 'images' }]),
  )
  async create(
    @ZodBody(ImageValidation.CREATE) request: CreateImageRequest,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'IMAGE',
      'CONTROLLER',
      'Create image request received',
      {
        productId: request.productId,
      },
    );

    const imageFiles: Express.Multer.File[] = [];
    if (files?.image && files.image.length > 0) {
      imageFiles.push(files.image[0]);
    }
    if (files?.images && files.images.length > 0) {
      imageFiles.push(...files.images);
    }

    if (imageFiles.length === 0) {
      throw new BadRequestException(
        'At least one image file is required (use "image" or "images" field).',
      );
    }

    const result = await this.imageService.create(
      request.productId,
      imageFiles,
    );
    const message = generateMessage({
      action: 'create',
      subject: imageFiles.length > 1 ? 'images' : 'image',
    });

    this.loggerService.info(
      'IMAGE',
      'CONTROLLER',
      'Images uploaded successfully',
      {
        count: result.length,
      },
    );

    return this.responseService.success({
      data: result,
      status: HttpStatus.CREATED,
      message,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<WebResponse<any[]>> {
    this.loggerService.info(
      'IMAGE',
      'CONTROLLER',
      'Fetch all images request received',
    );
    const result = await this.imageService.findAll();
    const message = generateMessage({ action: 'fetch', subject: 'images' });

    this.loggerService.info(
      'IMAGE',
      'CONTROLLER',
      'Images fetched successfully',
      {
        count: result.length,
      },
    );

    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'IMAGE',
      'CONTROLLER',
      'Fetch image by id request received',
      { id },
    );
    const result = await this.imageService.findById(id);
    const message = generateMessage({ action: 'fetch', subject: 'image' });

    this.loggerService.info(
      'IMAGE',
      'CONTROLLER',
      'Image fetched successfully',
      { id },
    );

    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }, { name: 'images' }]),
  )
  async update(
    @Param('id') idParam: string,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ): Promise<WebResponse<any>> {
    this.loggerService.info(
      'IMAGE',
      'CONTROLLER',
      'Update image request received',
      { idParam },
    );

    // Parse IDs (can be single or comma-separated list)
    const ids = idParam
      .split(',')
      .map((idStr) => parseInt(idStr.trim(), 10))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      throw new BadRequestException('Invalid image ID(s) provided.');
    }

    const imageFiles: Express.Multer.File[] = [];
    if (files?.image && files.image.length > 0) {
      imageFiles.push(files.image[0]);
    }
    if (files?.images && files.images.length > 0) {
      imageFiles.push(...files.images);
    }

    if (imageFiles.length === 0) {
      throw new BadRequestException(
        'At least one image file is required for updating.',
      );
    }

    if (ids.length !== imageFiles.length) {
      throw new BadRequestException(
        'The number of image IDs must match the number of files provided.',
      );
    }

    const result = await this.imageService.update(ids, imageFiles);
    const message = generateMessage({
      action: 'update',
      subject: ids.length > 1 ? 'images' : 'image',
    });

    this.loggerService.info(
      'IMAGE',
      'CONTROLLER',
      'Images updated successfully',
      {
        count: result.length,
      },
    );

    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  async remove(@Param('id') idParam: string): Promise<WebResponse<any>> {
    this.loggerService.info(
      'IMAGE',
      'CONTROLLER',
      'Delete image request received',
      { idParam },
    );

    const ids = idParam
      .split(',')
      .map((idStr) => parseInt(idStr.trim(), 10))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      throw new BadRequestException('Invalid image ID(s) provided.');
    }

    const result = await this.imageService.remove(ids);
    const message = generateMessage({
      action: 'delete',
      subject: ids.length > 1 ? 'images' : 'image',
    });

    this.loggerService.info(
      'IMAGE',
      'CONTROLLER',
      'Images deleted successfully',
      {
        count: result.length,
      },
    );

    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message,
    });
  }
}
