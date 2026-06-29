import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { AddCartItemRequest, SyncCartRequest, UpdateCartItemRequest } from './dto/cart.dto';
import { Cart, CartItem } from 'src/generated/prisma/client';

@Injectable()
export class CartService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerService,
  ) {}

  // Helper: Dapatkan atau buat cart untuk user (fixed race condition with upsert)
  async getOrCreateCart(userId: number): Promise<Cart> {
    return this.prismaService.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  // Get Cart (dengan items)
  async getCart(userId: number) {
    const cart = await this.getOrCreateCart(userId);
    return this.prismaService.cart.findUnique({
      where: { id: cart.id },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              }
            }
          },
        },
      },
    });
  }

  // Add Item to Cart
  async addItem(userId: number, request: AddCartItemRequest) {
    const cart = await this.getOrCreateCart(userId);

    // Cek produk apakah ada
    const product = await this.prismaService.product.findUnique({
      where: { id: request.productId },
    });
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    // Cek jika item sudah ada di keranjang
    const existingItem = await this.prismaService.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: request.productId,
        },
      },
    });

    if (existingItem) {
      // Tambahkan kuantitas
      const newQuantity = existingItem.quantity + request.quantity;
      return this.prismaService.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: Math.min(newQuantity, product.stock) }, // batasi by stok
      });
    } else {
      // Buat item baru
      return this.prismaService.cartItem.create({
        data: {
          cartId: cart.id,
          productId: request.productId,
          quantity: Math.min(request.quantity, product.stock),
        },
      });
    }
  }

  // Update Item Quantity
  async updateItem(userId: number, productId: number, request: UpdateCartItemRequest) {
    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prismaService.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      include: { product: true }
    });

    if (!existingItem) {
      throw new HttpException('Item not found in cart', HttpStatus.NOT_FOUND);
    }

    return this.prismaService.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: Math.min(request.quantity, existingItem.product.stock) },
    });
  }

  // Remove Item
  async removeItem(userId: number, productId: number) {
    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prismaService.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!existingItem) {
      return null;
    }

    return this.prismaService.cartItem.delete({
      where: { id: existingItem.id },
    });
  }

  // Clear Cart
  async clearCart(userId: number) {
    const cart = await this.getOrCreateCart(userId);
    return this.prismaService.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  // Sync Cart (dari localStorage ke DB saat login)
  async syncCart(userId: number, request: SyncCartRequest) {
    const cart = await this.getOrCreateCart(userId);
    
    for (const item of request.items) {
      const product = await this.prismaService.product.findUnique({
        where: { id: item.productId }
      });
      
      if (!product) continue; // lewati produk yg tidak valid

      const existingItem = await this.prismaService.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: item.productId,
          },
        },
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity + item.quantity;
        await this.prismaService.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: Math.min(newQuantity, product.stock) },
        });
      } else {
        await this.prismaService.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            quantity: Math.min(item.quantity, product.stock),
          },
        });
      }
    }

    return this.getCart(userId);
  }
}
