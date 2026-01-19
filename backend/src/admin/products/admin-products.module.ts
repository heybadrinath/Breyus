import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminProductsController } from './admin-products.controller';
import { AdminProductsService } from './admin-products.service';
import { Product, ProductSchema } from '../../products/schema/products.schema';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { ActivityLogModule } from '../activity/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    AdminAuthModule,
    ActivityLogModule,
  ],
  controllers: [AdminProductsController],
  providers: [AdminProductsService],
  exports: [AdminProductsService],
})
export class AdminProductsModule {}
