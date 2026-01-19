import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { AdminAuthModule } from '../auth/admin-auth.module';

// Import schemas from existing modules
import { User, UserSchema } from '../../users/user.schema';
import { Company, CompanySchema } from '../../company/company.schema';
import { Trade, TradeSchema } from '../../trade/schema/trade.schema';
import { Product, ProductSchema } from '../../products/schema/products.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Trade.name, schema: TradeSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    AdminAuthModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
