import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { HelpersModule } from 'src/helpers/helpers.module';

@Module({
  imports: [CloudinaryModule, HelpersModule],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
