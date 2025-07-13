import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HSN, HSNSchema } from './schema/hsn.schema';
import { Product, ProductSchema } from './schema/products.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HSN.name, schema: HSNSchema },]),
    MongooseModule.forFeature([{name: Product.name, schema: ProductSchema}])
  ],
  providers: [ProductsService],
  controllers: [ProductsController]
})
export class ProductsModule { }
