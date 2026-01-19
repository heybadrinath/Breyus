import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { ActivityLogModule } from './activity/activity-log.module';
import { SystemModule } from './system/system.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SearchModule } from './search/search.module';
import { AdminGatewayModule } from './gateway/admin-gateway.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminCompaniesModule } from './companies/admin-companies.module';
import { AdminKycModule } from './kyc/admin-kyc.module';
import { AdminTradesModule } from './trades/admin-trades.module';
import { AdminDisputesModule } from './disputes/admin-disputes.module';
import { AdminContentModule } from './content/admin-content.module';
import { AdminAnalyticsModule } from './analytics/admin-analytics.module';
import { AdminBlogModule } from './blog/admin-blog.module';
import { AdminProductsModule } from './products/admin-products.module';
import { AlertsModule } from './alerts/alerts.module';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    AdminAuthModule,
    ActivityLogModule,
    SystemModule,
    DashboardModule,
    SearchModule,
    AdminGatewayModule,
    AdminUsersModule,
    AdminCompaniesModule,
    AdminKycModule,
    AdminTradesModule,
    AdminDisputesModule,
    AdminContentModule,
    AdminAnalyticsModule,
    AdminBlogModule,
    AdminProductsModule,
    AlertsModule,
    SecurityModule,
  ],
  exports: [
    AdminAuthModule,
    ActivityLogModule,
    SystemModule,
    DashboardModule,
    SearchModule,
    AdminGatewayModule,
    AdminUsersModule,
    AdminCompaniesModule,
    AdminKycModule,
    AdminTradesModule,
    AdminDisputesModule,
    AdminContentModule,
    AdminAnalyticsModule,
    AdminBlogModule,
    AdminProductsModule,
    AlertsModule,
    SecurityModule,
  ],
})
export class AdminModule {}
