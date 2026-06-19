import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { HelpersModule } from './helpers/helpers.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [CommonModule, HelpersModule, AuthModule, UserModule, CategoryModule, ProductModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
