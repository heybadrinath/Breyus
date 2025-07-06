import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HSN, HSNSchema } from './hsn.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: HSN.name, schema: HSNSchema },
  ])],
  providers: [ProductsService],
  controllers: [ProductsController]
})
export class ProductsModule {}
