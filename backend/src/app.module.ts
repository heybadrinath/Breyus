import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { CompanyModule } from './company/company.module';
import { MailModule } from './mail/mail.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { LoginModule } from './login/login.module';
import { ProductsModule } from './products/products.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { InboxModule } from './inbox/inbox.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot((process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI_DEV) as string),
    AuthModule,
    UsersModule,
    CompanyModule,
    MailModule,
    OnboardingModule,
    LoginModule,
    ProductsModule,
    WishlistModule,
    InboxModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  
})



export class AppModule {}
