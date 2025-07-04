import { Module } from '@nestjs/common';
import { MongooseModule, Schema } from '@nestjs/mongoose';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { Company, CompanySchema } from '../company/company.schema';
import { User, UserSchema } from '../users/user.schema';
import { AuthModule } from 'src/auth/auth.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  providers: [LoginService],
  imports: [
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
    AuthModule,
    MailModule
  ],
  controllers: [LoginController]
})
export class LoginModule { }
