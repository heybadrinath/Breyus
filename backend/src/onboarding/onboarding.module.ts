import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from 'src/company/company.schema';
import {User, UserSchema } from 'src/users/user.schema'
import { MailModule } from 'src/mail/mail.module';


@Module({
  imports: [
  MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema}]),
  MongooseModule.forFeature([{ name: User.name, schema: UserSchema}]),
  MailModule
  ],
  providers: [OnboardingService],
  controllers: [OnboardingController]
})
export class OnboardingModule {}
