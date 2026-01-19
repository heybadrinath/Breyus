import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommoditiesController } from './commodities.controller';
import { CommoditiesService } from './commodities.service';

/**
 * CommoditiesModule
 *
 * Provides real commodity futures price data for the marketplace widget.
 * Integrates with Alpha Vantage API for live market data.
 *
 * Features:
 * - Real prices from Alpha Vantage (free tier: 25 requests/day)
 * - In-memory caching with 6-hour refresh cycle
 * - Automatic fallback to mock data if API key not configured
 * - Covers: Gold, Silver, Oil, Gas, Copper, Aluminum, Wheat, Corn, etc.
 *
 * Configuration:
 * - Set ALPHA_VANTAGE_API_KEY in .env (get free key at alphavantage.co)
 */
@Module({
  imports: [ConfigModule],
  controllers: [CommoditiesController],
  providers: [CommoditiesService],
  exports: [CommoditiesService],
})
export class CommoditiesModule {}
