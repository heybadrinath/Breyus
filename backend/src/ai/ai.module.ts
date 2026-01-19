import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { AIHttpService } from './ai-http.service';
import { PlatformAwarenessService } from './platform-awareness.service';
// CommoditiesModule removed - commodity search now uses categories with isMainstream filter
import { AuthModule } from '../auth/auth.module';
import { AdminContentModule } from '../admin/content/admin-content.module';
import { Product, ProductSchema } from '../products/schema/products.schema';
import { Trade, TradeSchema } from '../trade/schema/trade.schema';
import { User, UserSchema } from '../users/user.schema';
import { Company, CompanySchema } from '../company/company.schema';

/**
 * AI Module
 * Orchestrates AI-powered features:
 * - Partner prediction (buyer/seller matching)
 * - Platform awareness (on-platform detection)
 * - Market analysis
 * - Gravity score calculation
 * - Commodity search
 */
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Trade.name, schema: TradeSchema },
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
    }),
    AuthModule,
    AdminContentModule,
  ],
  controllers: [AIController],
  providers: [
    AIService,
    AIHttpService,
    PlatformAwarenessService,
  ],
  exports: [AIService, AIHttpService],
})
export class AIModule {}
