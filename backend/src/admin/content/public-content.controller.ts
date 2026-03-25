import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { SuggestCategoryDto } from './dto';

// Services
import { CurrenciesService } from './services/currencies.service';
import { CountriesService } from './services/countries.service';
import { IncotermsService } from './services/incoterms.service';
import { CategoriesService } from './services/categories.service';
import { HSNCodesService } from './services/hsn-codes.service';
import { PortsService } from './services/ports.service';
import { UnitsService } from './services/units.service';

/**
 * Public Content Controller
 *
 * Provides unauthenticated access to admin-managed content for the main frontend.
 * These endpoints return read-only data that has been configured via the admin portal.
 */
@Controller('public/content')
export class PublicContentController {
  constructor(
    private readonly currenciesService: CurrenciesService,
    private readonly countriesService: CountriesService,
    private readonly incotermsService: IncotermsService,
    private readonly categoriesService: CategoriesService,
    private readonly hsnCodesService: HSNCodesService,
    private readonly portsService: PortsService,
    private readonly unitsService: UnitsService,
  ) {}

  /**
   * Get all active currencies
   * GET /public/content/currencies
   */
  @Get('currencies')
  async getActiveCurrencies() {
    const result = await this.currenciesService.getCurrencies({
      isActive: true,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Currencies retrieved successfully',
      data: result.currencies,
    };
  }

  /**
   * Get all active countries
   * GET /public/content/countries?continent=Asia
   */
  @Get('countries')
  async getActiveCountries(
    @Query('continent')
    continent?:
      | 'Africa'
      | 'Asia'
      | 'Europe'
      | 'North America'
      | 'South America'
      | 'Oceania'
      | 'Antarctica',
  ) {
    const result = await this.countriesService.getCountries({
      isActive: true,
      continent,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Countries retrieved successfully',
      data: result.countries,
    };
  }

  /**
   * Get all incoterms (all 11 are always active)
   * GET /public/content/incoterms
   */
  @Get('incoterms')
  async getIncoterms() {
    const result = await this.incotermsService.getIncoterms({});
    return {
      statusCode: HttpStatus.OK,
      message: 'Incoterms retrieved successfully',
      data: result.incoterms,
    };
  }

  /**
   * Get incoterm codes only (for dropdown)
   * GET /public/content/incoterms/codes
   */
  @Get('incoterms/codes')
  getIncotermCodes() {
    const codes = this.incotermsService.getIncotermCodes();
    return {
      statusCode: HttpStatus.OK,
      message: 'Incoterm codes retrieved successfully',
      data: codes,
    };
  }

  /**
   * Get category tree structure (for navigation/dropdowns)
   * GET /public/content/categories/tree
   */
  @Get('categories/tree')
  async getCategoryTree() {
    const result = await this.categoriesService.getCategoryTree();
    return {
      statusCode: HttpStatus.OK,
      message: 'Category tree retrieved successfully',
      data: result.tree,
    };
  }

  /**
   * Get flat list of active categories
   * GET /public/content/categories
   */
  @Get('categories')
  async getCategories() {
    const result = await this.categoriesService.getCategories({
      isActive: true,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Categories retrieved successfully',
      data: result.categories,
    };
  }

  /**
   * Search HSN codes (for autocomplete in product forms)
   * GET /public/content/hsn-codes/search?q=fertilizer&limit=20
   */
  @Get('hsn-codes/search')
  async searchHSNCodes(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const results = await this.hsnCodesService.searchHSNCodes(
      query || '',
      limit ? parseInt(limit, 10) : 20,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Search completed',
      data: results,
    };
  }

  /**
   * Get HSN code categories (for filtering)
   * GET /public/content/hsn-codes/categories
   */
  @Get('hsn-codes/categories')
  async getHSNCategories() {
    const categories = await this.hsnCodesService.getCategories();
    return {
      statusCode: HttpStatus.OK,
      message: 'HSN categories retrieved successfully',
      data: categories,
    };
  }

  /**
   * Get active ports, optionally filtered by country
   * GET /public/content/ports?country=countryId&type=sea
   */
  @Get('ports')
  async getPorts(
    @Query('country') countryId?: string,
    @Query('type') type?: string,
  ) {
    const result = await this.portsService.getPorts({
      isActive: true,
      country: countryId,
      type: type as 'sea' | 'air' | 'land' | undefined,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Ports retrieved successfully',
      data: result.ports,
    };
  }

  /**
   * Get all active units, optionally filtered by type
   * GET /public/content/units?type=weight
   */
  @Get('units')
  async getUnits(
    @Query('type') type?: 'weight' | 'volume' | 'count' | 'length' | 'area',
  ) {
    const result = await this.unitsService.getUnits({
      isActive: true,
      type,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Units retrieved successfully',
      data: result.units,
    };
  }

  /**
   * Get all active units grouped by type
   * GET /public/content/units/grouped
   */
  @Get('units/grouped')
  async getUnitsGrouped() {
    const result = await this.unitsService.getUnitsGrouped();
    return {
      statusCode: HttpStatus.OK,
      message: 'Grouped units retrieved successfully',
      data: result,
    };
  }

  // ==========================================================
  // CATEGORY/COMMODITY ENDPOINTS (Mainstream/Niche Feature)
  // ==========================================================

  /**
   * Get categories grouped by mainstream/niche classification
   * Used for seller dropdown in product creation
   * Includes user's pending (unapproved) categories if authenticated
   * GET /public/content/categories/grouped
   */
  @Get('categories/grouped')
  @UseGuards(AuthGuard)
  async getCategoriesGrouped(@Req() req: any) {
    const userId = req.user?.userId || req.user?._id;
    const result =
      await this.categoriesService.getCategoriesGroupedByClassification(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Categories grouped by classification retrieved successfully',
      data: result,
    };
  }

  /**
   * Suggest a new category (for sellers who can't find their commodity)
   * Creates a new category with isActive=false, pending admin approval
   * POST /public/content/categories/suggest
   * Requires authentication
   */
  @Post('categories/suggest')
  @UseGuards(AuthGuard)
  async suggestNewCategory(@Body() dto: SuggestCategoryDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?._id;
    if (!userId) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'User not authenticated',
      };
    }

    const result = await this.categoriesService.addUserCategory(dto, userId);
    return {
      statusCode: HttpStatus.CREATED,
      message:
        'Category suggestion submitted successfully. It will be available after admin approval.',
      data: result,
    };
  }

  /**
   * Get commodity/category stats
   * GET /public/content/categories/commodity-stats
   */
  @Get('categories/commodity-stats')
  async getCommodityStats() {
    const result = await this.categoriesService.getCommodityStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Commodity stats retrieved successfully',
      data: result,
    };
  }

  // ==========================================================
  // INTERNAL ENDPOINTS (Service-to-Service Communication)
  // ==========================================================

  /**
   * Internal endpoint for AI server to fetch commodity classifications
   * GET /public/content/internal/commodities
   * No authentication required (internal use only)
   *
   * Returns commodities grouped by mainstream/niche classification
   * with aliases for fuzzy matching support.
   */
  @Get('internal/commodities')
  async getInternalCommodities() {
    const data = await this.categoriesService.getCommoditiesForAI();
    return {
      statusCode: HttpStatus.OK,
      message: 'Commodities retrieved for AI classification',
      data,
    };
  }
}
