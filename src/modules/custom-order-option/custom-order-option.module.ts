import { Module } from '@nestjs/common';
import { CustomOrderOptionController } from './custom-order-option.controller';
import { CustomOrderOptionService } from './custom-order-option.service';

@Module({
  controllers: [CustomOrderOptionController],
  providers: [CustomOrderOptionService],
})
export class CustomOrderOptionModule {}
