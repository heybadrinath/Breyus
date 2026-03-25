import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogAuthController } from './blog-auth.controller';
import { BlogAuthService } from './blog-auth.service';
import { BlogAuthGuard } from './guards/blog-auth.guard';
import { BlogWriterGuard } from './guards/blog-writer.guard';
import { BlogMemberGuard } from './guards/blog-member.guard';
import { BlogUser, BlogUserSchema } from '../schemas/blog-user.schema';
import { BlogSession, BlogSessionSchema } from '../schemas/blog-session.schema';
import { User, UserSchema } from '../../users/user.schema';
import { Company, CompanySchema } from '../../company/company.schema';
import { MailModule } from '../../mail/mail.module';

/**
 * BlogAuthModule - Blog Portal Authentication
 *
 * Provides:
 * - Blog user management (signup, login)
 * - Breyus SSO integration (OTP-based)
 * - Session management
 * - Guards for protected routes
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogUser.name, schema: BlogUserSchema },
      { name: BlogSession.name, schema: BlogSessionSchema },
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    forwardRef(() => MailModule),
  ],
  controllers: [BlogAuthController],
  providers: [BlogAuthService, BlogAuthGuard, BlogWriterGuard, BlogMemberGuard],
  exports: [
    BlogAuthService,
    BlogAuthGuard,
    BlogWriterGuard,
    BlogMemberGuard,
    MongooseModule,
  ],
})
export class BlogAuthModule {}
