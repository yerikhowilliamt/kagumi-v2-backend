import { Controller, Get, Post, Query, HttpCode, HttpStatus, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { ZodBody } from 'src/common/validation/validation.decorator';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from 'src/generated/prisma/client';
import { CreateReviewRequest } from './dto/create-review.dto';
import { ReviewValidation } from './review.validation';
import { generateMessage } from 'src/common/utils/message.util';
import WebResponse from 'src/models/web.model';
import { Paging } from 'src/models/web.model';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly reviewService: ReviewService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAccessAuthGuard, RoleGuard)
  @Roles('USER', 'ADMIN')
  async create(
    @Auth() user: User,
    @ZodBody(ReviewValidation.CREATE) request: CreateReviewRequest,
  ): Promise<WebResponse<any>> {
    this.loggerService.info('REVIEW', 'CONTROLLER', 'Create review request received', {
      userId: user.id,
      productId: request.productId,
    });
    const result = await this.reviewService.create(user.id, request);
    const message = generateMessage({ action: 'create', subject: 'review' });

    return this.responseService.success({
      data: result,
      status: HttpStatus.CREATED,
      message,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getReviewsByProductId(
    @Query('productId', ParseIntPipe) productId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size: number,
  ): Promise<WebResponse<any[]>> {
    this.loggerService.info('REVIEW', 'CONTROLLER', 'Fetch reviews request received', { productId });
    
    const { totalData, reviews } = await this.reviewService.getReviewsByProductId(productId, page, size);
    const message = generateMessage({ action: 'fetch', subject: 'reviews' });

    return this.responseService.success({
      data: reviews,
      status: HttpStatus.OK,
      message,
      paging: new Paging({
        size,
        totalData,
        totalPage: Math.ceil(totalData / size),
        currentPage: page,
      })
    });
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getProductReviewStats(
    @Query('productId', ParseIntPipe) productId: number,
  ): Promise<WebResponse<any>> {
    this.loggerService.info('REVIEW', 'CONTROLLER', 'Fetch review stats request received', { productId });
    const result = await this.reviewService.getProductReviewStats(productId);
    
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message: 'Review stats fetched successfully',
    });
  }
}
