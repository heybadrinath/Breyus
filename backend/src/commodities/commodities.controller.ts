import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import {
  CommoditiesService,
  CommodityCategory,
  CommodityPrice,
  CommodityPriceSummary,
} from './commodities.service';

/**
 * CommoditiesController
 *
 * Provides REST endpoints for commodity futures prices.
 * Used by the CommodityPriceWidget on the marketplace page.
 */
@Controller('commodities')
export class CommoditiesController {
  constructor(private readonly commoditiesService: CommoditiesService) {}

  /**
   * GET /commodities/prices
   * Returns all commodity prices with summary metadata
   */
  @Get('prices')
  async getPriceSummary(): Promise<{
    statusCode: number;
    message: string;
    data: CommodityPriceSummary;
  }> {
    const data = await this.commoditiesService.getPriceSummary();
    return {
      statusCode: 200,
      message: 'Commodity prices fetched successfully',
      data,
    };
  }

  /**
   * GET /commodities/prices/:symbol
   * Returns price for a specific commodity by symbol
   */
  @Get('prices/:symbol')
  async getPriceBySymbol(
    @Param('symbol') symbol: string,
  ): Promise<{ statusCode: number; message: string; data: CommodityPrice }> {
    const data = await this.commoditiesService.getPriceBySymbol(
      symbol.toUpperCase(),
    );
    if (!data) {
      throw new NotFoundException(
        `Commodity with symbol '${symbol}' not found`,
      );
    }
    return {
      statusCode: 200,
      message: 'Commodity price fetched successfully',
      data,
    };
  }

  /**
   * GET /commodities/prices/category/:category
   * Returns all prices for a specific category
   */
  @Get('prices/category/:category')
  async getPricesByCategory(
    @Param('category') category: string,
  ): Promise<{ statusCode: number; message: string; data: CommodityPrice[] }> {
    // Validate category
    const validCategories: CommodityCategory[] = [
      'Energy',
      'Metals',
      'Agricultural',
      'Precious Metals',
    ];
    if (!validCategories.includes(category as CommodityCategory)) {
      throw new NotFoundException(
        `Category '${category}' not found. Valid categories: ${validCategories.join(', ')}`,
      );
    }

    const data = await this.commoditiesService.getPricesByCategory(
      category as CommodityCategory,
    );
    return {
      statusCode: 200,
      message: `Commodity prices for category '${category}' fetched successfully`,
      data,
    };
  }
}
