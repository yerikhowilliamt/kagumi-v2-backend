import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { CreateOrderItemRequest } from './dto/create-order-item.dto';
import { UpdateOrderItemRequest } from './dto/update-order-item.dto';

@Injectable()
export class OrderItemService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async recalculateOrderTotal(tx: any, orderId: number) {
    const items = await tx.orderItem.findMany({
      where: { orderId },
    });
    const total = items.reduce(
      (sum, item) => sum + Number(item.priceEach) * item.quantity,
      0,
    );
    await tx.order.update({
      where: { id: orderId },
      data: { totalPrice: total },
    });
  }

  async create(
    userId: number,
    role: string,
    payload: CreateOrderItemRequest,
    file?: Express.Multer.File,
  ) {
    this.loggerService.info('ORDER_ITEM', 'SERVICE', 'Creating order item initiated', {
      userId,
      role,
      orderId: payload.orderId,
      productId: payload.productId,
    });

    // 1. Verify parent Order exists and belongs to the user (unless ADMIN)
    const order = await this.prismaService.order.findUnique({
      where: { id: payload.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order not found with ID: ${payload.orderId}`);
    }

    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('You are not authorized to add items to this order');
    }

    // 2. Verify Product exists and check stock
    const product = await this.prismaService.product.findUnique({
      where: { id: payload.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product not found with ID: ${payload.productId}`);
    }

    if (product.stock < payload.quantity) {
      throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
    }

    // 3. Handle Cloudinary image upload if provided
    let finalNote = payload.note || null;
    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        finalNote = JSON.stringify({
          text: payload.note || '',
          imageUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        });
      } catch (error) {
        const err = error as Error;
        this.loggerService.error('ORDER_ITEM', 'SERVICE', 'Cloudinary upload failed', {
          error: err.message,
        });
        throw new BadRequestException(`Failed to upload image: ${err.message}`);
      }
    }

    // 4. Create OrderItem, decrement product stock, and recalculate order total in a transaction
    const result = await this.prismaService.$transaction(async (tx) => {
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: payload.orderId,
          productId: payload.productId,
          quantity: payload.quantity,
          note: finalNote,
          priceEach: payload.priceEach,
        },
        include: {
          product: true,
          order: true,
        },
      });

      const updatedProduct = await tx.product.updateMany({
        where: { 
          id: payload.productId,
          stock: { gte: payload.quantity },
        },
        data: {
          stock: {
            decrement: payload.quantity,
          },
        },
      });

      if (updatedProduct.count === 0) {
        throw new BadRequestException(`Insufficient stock for product id: ${payload.productId}`);
      }

      await this.recalculateOrderTotal(tx, payload.orderId);

      return orderItem;
    });

    this.loggerService.info('ORDER_ITEM', 'SERVICE', 'Order item created successfully', {
      id: result.id,
    });

    return result;
  }

  async findAll(userId: number, role: string) {
    this.loggerService.info('ORDER_ITEM', 'SERVICE', 'Fetching order items', {
      userId,
      role,
    });

    const where = role === 'ADMIN' ? {} : { order: { userId } };

    const items = await this.prismaService.orderItem.findMany({
      where,
      include: {
        product: true,
        order: {
          select: {
            id: true,
            userId: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    this.loggerService.info('ORDER_ITEM', 'SERVICE', 'Order items fetched', {
      count: items.length,
    });

    return items;
  }

  async findById(id: number, userId: number, role: string) {
    this.loggerService.info('ORDER_ITEM', 'SERVICE', 'Fetching order item by ID', {
      id,
      userId,
      role,
    });

    const item = await this.prismaService.orderItem.findUnique({
      where: { id },
      include: {
        product: true,
        order: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Order item not found with ID: ${id}`);
    }

    if (role !== 'ADMIN' && item.order.userId !== userId) {
      throw new ForbiddenException('You are not authorized to view this order item');
    }

    return item;
  }

  async update(id: number, payload: UpdateOrderItemRequest, file?: Express.Multer.File) {
    this.loggerService.info('ORDER_ITEM', 'SERVICE', 'Updating order item initiated', {
      id,
      payload,
    });

    // 1. Verify item exists
    const item = await this.prismaService.orderItem.findUnique({
      where: { id },
      include: { order: true, product: true },
    });

    if (!item) {
      throw new NotFoundException(`Order item not found with ID: ${id}`);
    }

    // 2. Validate changing Product
    const targetProductId = payload.productId !== undefined ? payload.productId : item.productId;
    const targetProduct = await this.prismaService.product.findUnique({
      where: { id: targetProductId },
    });

    if (!targetProduct) {
      throw new NotFoundException(`Product not found with ID: ${targetProductId}`);
    }

    // 3. Handle stock changes if quantity or product changes
    const oldQty = item.quantity;
    const newQty = payload.quantity !== undefined ? payload.quantity : oldQty;
    const isProductChanged = targetProductId !== item.productId;

    if (isProductChanged) {
      // Check stock on new product
      if (targetProduct.stock < newQty) {
        throw new BadRequestException(`Insufficient stock for new product: ${targetProduct.name}`);
      }
    } else {
      // Same product, check stock difference
      const qtyDiff = newQty - oldQty;
      if (qtyDiff > 0 && targetProduct.stock < qtyDiff) {
        throw new BadRequestException(`Insufficient stock for product: ${targetProduct.name}`);
      }
    }

    // 4. Handle Cloudinary upload if file is provided
    let finalNote = item.note;
    if (file) {
      try {
        // If there was a previous image, delete it
        if (item.note) {
          try {
            const parsed = JSON.parse(item.note);
            if (parsed && parsed.publicId) {
              await this.cloudinaryService.destroyFile(parsed.publicId);
            }
          } catch {
            // Note wasn't JSON or didn't have publicId, ignore
          }
        }

        const uploadResult = await this.cloudinaryService.uploadFile(file);
        const currentText = payload.note !== undefined ? (payload.note || '') : '';
        finalNote = JSON.stringify({
          text: currentText,
          imageUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        });
      } catch (error) {
        const err = error as Error;
        this.loggerService.error('ORDER_ITEM', 'SERVICE', 'Cloudinary upload failed on update', {
          error: err.message,
        });
        throw new BadRequestException(`Failed to upload image: ${err.message}`);
      }
    } else if (payload.note !== undefined) {
      // Note text was updated, but no new file.
      // If old note was JSON, preserve imageUrl and publicId, only change text.
      if (item.note) {
        try {
          const parsed = JSON.parse(item.note);
          finalNote = JSON.stringify({
            ...parsed,
            text: payload.note || '',
          });
        } catch {
          finalNote = payload.note || null;
        }
      } else {
        finalNote = payload.note || null;
      }
    }

    // 5. Execute updates inside a transaction
    const result = await this.prismaService.$transaction(async (tx) => {
      // Revert stock on old product
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: oldQty,
          },
        },
      });

      // Deduct stock on new (or same) product
      const updatedProduct = await tx.product.updateMany({
        where: { 
          id: targetProductId,
          stock: { gte: newQty },
        },
        data: {
          stock: {
            decrement: newQty,
          },
        },
      });

      if (updatedProduct.count === 0) {
        throw new BadRequestException(`Insufficient stock for product id: ${targetProductId}`);
      }

      const updated = await tx.orderItem.update({
        where: { id },
        data: {
          orderId: payload.orderId !== undefined ? payload.orderId : item.orderId,
          productId: targetProductId,
          quantity: newQty,
          note: finalNote,
          priceEach: payload.priceEach !== undefined ? payload.priceEach : item.priceEach,
        },
        include: {
          product: true,
          order: true,
        },
      });

      // Recalculate parent orders (if orderId changed, recalculate both, otherwise recalculate current)
      await this.recalculateOrderTotal(tx, item.orderId);
      if (payload.orderId !== undefined && payload.orderId !== item.orderId) {
        await this.recalculateOrderTotal(tx, payload.orderId);
      }

      return updated;
    });

    this.loggerService.info('ORDER_ITEM', 'SERVICE', 'Order item updated successfully', {
      id,
    });

    return result;
  }

  async remove(id: number) {
    this.loggerService.info('ORDER_ITEM', 'SERVICE', 'Deleting order item initiated', {
      id,
    });

    // 1. Verify item exists
    const item = await this.prismaService.orderItem.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!item) {
      throw new NotFoundException(`Order item not found with ID: ${id}`);
    }

    // 2. Delete and clean up in a transaction
    const result = await this.prismaService.$transaction(async (tx) => {
      // Restore product stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });

      const deleted = await tx.orderItem.delete({
        where: { id },
      });

      // Recalculate parent order price
      await this.recalculateOrderTotal(tx, item.orderId);

      return deleted;
    });

    // 3. Clean up Cloudinary image if it exists
    if (item.note) {
      try {
        const parsed = JSON.parse(item.note);
        if (parsed && parsed.publicId) {
          await this.cloudinaryService.destroyFile(parsed.publicId);
        }
      } catch {
        // Ignore JSON parsing issues or missing publicId
      }
    }

    this.loggerService.info('ORDER_ITEM', 'SERVICE', 'Order item deleted successfully', {
      id,
    });

    return result;
  }
}
