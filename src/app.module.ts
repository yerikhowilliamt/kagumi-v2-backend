import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { HelpersModule } from './helpers/helpers.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { ImageModule } from './modules/image/image.module';
import { PaymentModule } from './modules/payment/payment.module';
import { OrderItemModule } from './modules/order-item/order-item.module';
import { CustomOrderOptionModule } from './modules/custom-order-option/custom-order-option.module';

@Module({
  imports: [
    CommonModule,
    HelpersModule,
    AuthModule,
    UserModule,
    CategoryModule,
    ProductModule,
    OrderModule,
    ImageModule,
    PaymentModule,
    OrderItemModule,
    CustomOrderOptionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
