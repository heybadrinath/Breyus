import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminContentController } from './admin-content.controller';
import { PublicContentController } from './public-content.controller';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { ActivityLogModule } from '../activity/activity-log.module';
import { AuthModule } from '../../auth/auth.module';
import { MailModule } from '../../mail/mail.module';

// Schemas
import {
  Currency,
  CurrencySchema,
  Country,
  CountrySchema,
  Port,
  PortSchema,
  ProductCategory,
  ProductCategorySchema,
  Incoterm,
  IncotermSchema,
  // Note: Commodity removed - classification merged into ProductCategory
  Unit,
  UnitSchema,
} from './schemas';
import { HSN, HSNSchema } from '../../products/schema/hsn.schema';
import { Product, ProductSchema } from '../../products/schema/products.schema';
import { User, UserSchema } from '../../users/user.schema';

// Services
import { CurrenciesService } from './services/currencies.service';
import { CountriesService } from './services/countries.service';
import { PortsService } from './services/ports.service';
import { HSNCodesService } from './services/hsn-codes.service';
import { CategoriesService } from './services/categories.service';
import { IncotermsService } from './services/incoterms.service';
// Note: AdminCommoditiesService removed - functionality merged into CategoriesService
import { UnitsService } from './services/units.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Currency.name, schema: CurrencySchema },
      { name: Country.name, schema: CountrySchema },
      { name: Port.name, schema: PortSchema },
      { name: ProductCategory.name, schema: ProductCategorySchema },
      { name: Incoterm.name, schema: IncotermSchema },
      { name: HSN.name, schema: HSNSchema },
      // Commodity removed - classification merged into ProductCategory
      { name: Unit.name, schema: UnitSchema },
      // For category rejection with product reassignment
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => AdminAuthModule),
    forwardRef(() => ActivityLogModule),
    forwardRef(() => AuthModule),
    MailModule,
  ],
  controllers: [AdminContentController, PublicContentController],
  providers: [
    CurrenciesService,
    CountriesService,
    PortsService,
    HSNCodesService,
    CategoriesService,
    IncotermsService,
    // AdminCommoditiesService removed - functionality merged into CategoriesService
    UnitsService,
  ],
  exports: [
    CurrenciesService,
    CountriesService,
    PortsService,
    HSNCodesService,
    CategoriesService,
    IncotermsService,
    // AdminCommoditiesService removed - functionality merged into CategoriesService
    UnitsService,
  ],
})
export class AdminContentModule {}
