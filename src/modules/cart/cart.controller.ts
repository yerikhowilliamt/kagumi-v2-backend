import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { AddCartItemRequest, SyncCartRequest, UpdateCartItemRequest } from './dto/cart.dto';
import { ZodBody } from 'src/common/validation/validation.decorator';
import { CartValidation } from './cart.validation';
import { ResponseService } from 'src/helpers/response/response.service';
import { generateMessage } from 'src/common/utils/message.util';

@Controller('cart')
@UseGuards(JwtAccessAuthGuard)
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly responseService: ResponseService
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getCart(@Req() req: any) {
    const userId = req.user.id;
    const cart = await this.cartService.getCart(userId);
    return this.responseService.success({
      data: cart,
      message: generateMessage({ action: 'fetch', subject: 'cart' })
    });
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addItem(
    @Req() req: any,
    @ZodBody(CartValidation.ADD_ITEM) request: AddCartItemRequest
  ) {
    const userId = req.user.id;
    const item = await this.cartService.addItem(userId, request);
    return this.responseService.success({
      data: item,
      message: generateMessage({ action: 'create', subject: 'cart item' })
    });
  }

  @Patch('items/:productId')
  @HttpCode(HttpStatus.OK)
  async updateItem(
    @Req() req: any,
    @Param('productId', ParseIntPipe) productId: number,
    @ZodBody(CartValidation.UPDATE_ITEM) request: UpdateCartItemRequest
  ) {
    const userId = req.user.id;
    const item = await this.cartService.updateItem(userId, productId, request);
    return this.responseService.success({
      data: item,
      message: generateMessage({ action: 'update', subject: 'cart item' })
    });
  }

  @Delete('items/:productId')
  @HttpCode(HttpStatus.OK)
  async removeItem(
    @Req() req: any,
    @Param('productId', ParseIntPipe) productId: number
  ) {
    const userId = req.user.id;
    await this.cartService.removeItem(userId, productId);
    return this.responseService.success({
      data: null,
      message: generateMessage({ action: 'delete', subject: 'cart item' })
    });
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearCart(@Req() req: any) {
    const userId = req.user.id;
    await this.cartService.clearCart(userId);
    return this.responseService.success({
      data: null,
      message: generateMessage({ action: 'delete', subject: 'cart' })
    });
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncCart(
    @Req() req: any,
    @ZodBody(CartValidation.SYNC_CART) request: SyncCartRequest
  ) {
    const userId = req.user.id;
    const cart = await this.cartService.syncCart(userId, request);
    return this.responseService.success({
      data: cart,
      message: "Cart synced successfully"
    });
  }
}
