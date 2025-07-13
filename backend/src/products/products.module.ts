import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HSN, HSNSchema } from './schema/hsn.schema';
import { Product, ProductSchema } from './schema/products.schema';
import { JwtModule } from '@nestjs/jwt';
import { FileUploadInterceptor } from './file-upload.interceptor';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HSN.name, schema: HSNSchema },]),
    MongooseModule.forFeature([{name: Product.name, schema: ProductSchema}]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    AuthModule
  ],
  providers: [ProductsService, FileUploadInterceptor],
  controllers: [ProductsController]
})
export class ProductsModule { }
