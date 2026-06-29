import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateReviewRequest } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(userId: number, payload: CreateReviewRequest) {
    this.loggerService.info('REVIEW', 'SERVICE', 'Creating review initiated', { userId, payload });

    // 1. Verify that the product exists
    const product = await this.prismaService.product.findUnique({
      where: { id: payload.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product not found with ID: ${payload.productId}`);
    }

    // 2. Check if the user has purchased the item and the order is COMPLETED
    const completedOrderItems = await this.prismaService.orderItem.findFirst({
      where: {
        productId: payload.productId,
        order: {
          userId,
          status: 'COMPLETED',
        },
      },
    });

    if (!completedOrderItems) {
      this.loggerService.warn('REVIEW', 'SERVICE', 'User attempted to review product without a completed order', { userId, productId: payload.productId });
      throw new ForbiddenException('You must have a completed order of this product to leave a review.');
    }

    // 3. Optional: check if the user already reviewed this product from the same order
    // (If you want to limit 1 review per product per user, you can query here)

    const review = await this.prismaService.review.create({
      data: {
        userId,
        productId: payload.productId,
        orderId: payload.orderId || undefined,
        rating: payload.rating,
        comment: payload.comment || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          }
        }
      }
    });

    this.loggerService.info('REVIEW', 'SERVICE', 'Review created successfully', { id: review.id });
    return review;
  }

  async getReviewsByProductId(productId: number, page: number = 1, size: number = 10) {
    this.loggerService.info('REVIEW', 'SERVICE', 'Fetching reviews for product', { productId });
    
    const skip = (page - 1) * size;
    
    const [totalData, reviews] = await this.prismaService.$transaction([
      this.prismaService.review.count({ where: { productId } }),
      this.prismaService.review.findMany({
        where: { productId },
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            }
          }
        }
      })
    ]);

    return { totalData, reviews };
  }

  async getProductReviewStats(productId: number) {
    const stats = await this.prismaService.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { id: true },
    });

    const ratingGroups = await this.prismaService.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true },
    });

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingGroups.forEach((group) => {
      if (group.rating >= 1 && group.rating <= 5) {
        distribution[group.rating as keyof typeof distribution] = group._count.rating;
      }
    });

    return {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count.id || 0,
      distribution,
    };
  }
}
