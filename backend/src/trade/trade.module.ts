import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';
import { Trade, TradeSchema } from './schema/trade.schema';
import { Product, ProductSchema } from '../products/schema/products.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trade.name, schema: TradeSchema },
      { name: Product.name, schema: ProductSchema }
    ]),
    AuthModule
  ],
  providers: [TradeService],
  controllers: [TradeController],
  exports: [TradeService]
})
export class TradeModule {}
