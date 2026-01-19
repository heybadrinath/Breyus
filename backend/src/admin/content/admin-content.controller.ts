import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../common/decorators/admin-action.decorator';

// Services
import { CurrenciesService } from './services/currencies.service';
import { CountriesService } from './services/countries.service';
import { PortsService } from './services/ports.service';
import { HSNCodesService } from './services/hsn-codes.service';
import { CategoriesService } from './services/categories.service';
import { IncotermsService } from './services/incoterms.service';
// AdminCommoditiesService removed - functionality merged into CategoriesService
import { UnitsService } from './services/units.service';

// DTOs
import {
  CreateCurrencyDto,
  UpdateCurrencyDto,
  GetCurrenciesQueryDto,
  CreateCountryDto,
  UpdateCountryDto,
  GetCountriesQueryDto,
  CreatePortDto,
  UpdatePortDto,
  GetPortsQueryDto,
  CreateHSNCodeDto,
  UpdateHSNCodeDto,
  GetHSNCodesQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  GetCategoriesQueryDto,
  ReorderCategoryDto,
  ToggleMainstreamDto,
  ApproveCategoryDto,
  UpdateIncotermDto,
  GetIncotermsQueryDto,
  // Commodity DTOs removed - functionality merged into Categories
  CreateUnitDto,
  UpdateUnitDto,
  GetUnitsQueryDto,
} from './dto';

@Controller('admin/content')
@UseGuards(AdminAuthGuard)
export class AdminContentController {
  constructor(
    private readonly currenciesService: CurrenciesService,
    private readonly countriesService: CountriesService,
    private readonly portsService: PortsService,
    private readonly hsnCodesService: HSNCodesService,
    private readonly categoriesService: CategoriesService,
    private readonly incotermsService: IncotermsService,
    // AdminCommoditiesService removed - functionality merged into CategoriesService
    private readonly unitsService: UnitsService,
  ) {}

  // ============================================
  // CURRENCIES
  // ============================================

  /**
   * Get all currencies with optional filters
   * GET /admin/content/currencies?isActive=true&search=dollar
   */
  @Get('currencies')
  @AdminAction({ action: 'content.currencies.list', category: 'content' })
  async getCurrencies(@Query() query: GetCurrenciesQueryDto) {
    const result = await this.currenciesService.getCurrencies(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Currencies retrieved successfully',
      data: result,
    };
  }

  /**
   * Get currency by ID
   * GET /admin/content/currencies/:id
   */
  @Get('currencies/:id')
  @AdminAction({ action: 'content.currencies.view', category: 'content' })
  async getCurrencyById(@Param('id') id: string) {
    const currency = await this.currenciesService.getCurrencyById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Currency retrieved successfully',
      data: currency,
    };
  }

  /**
   * Get currency by code
   * GET /admin/content/currencies/code/:code
   */
  @Get('currencies/code/:code')
  @AdminAction({ action: 'content.currencies.view', category: 'content' })
  async getCurrencyByCode(@Param('code') code: string) {
    const currency = await this.currenciesService.getCurrencyByCode(code);
    return {
      statusCode: HttpStatus.OK,
      message: 'Currency retrieved successfully',
      data: currency,
    };
  }

  /**
   * Create a new currency
   * POST /admin/content/currencies
   */
  @Post('currencies')
  @AdminAction({ action: 'content.currencies.create', category: 'content' })
  async createCurrency(@Body() dto: CreateCurrencyDto) {
    const currency = await this.currenciesService.createCurrency(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Currency created successfully',
      data: currency,
    };
  }

  /**
   * Update an existing currency
   * PATCH /admin/content/currencies/:id
   */
  @Patch('currencies/:id')
  @AdminAction({ action: 'content.currencies.update', category: 'content' })
  async updateCurrency(
    @Param('id') id: string,
    @Body() dto: UpdateCurrencyDto,
  ) {
    const currency = await this.currenciesService.updateCurrency(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Currency updated successfully',
      data: currency,
    };
  }

  /**
   * Delete a currency
   * DELETE /admin/content/currencies/:id
   */
  @Delete('currencies/:id')
  @AdminAction({ action: 'content.currencies.delete', category: 'content' })
  async deleteCurrency(@Param('id') id: string) {
    await this.currenciesService.deleteCurrency(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Currency deleted successfully',
    };
  }

  /**
   * Seed default currencies
   * POST /admin/content/currencies/seed
   */
  @Post('currencies/seed')
  @AdminAction({ action: 'content.currencies.seed', category: 'content' })
  async seedCurrencies() {
    const result = await this.currenciesService.seedDefaultCurrencies();
    return {
      statusCode: HttpStatus.OK,
      message: `Seeded currencies: ${result.created} created, ${result.skipped} skipped`,
      data: result,
    };
  }

  // ============================================
  // COUNTRIES
  // ============================================

  /**
   * Get all countries with optional filters
   * GET /admin/content/countries?isActive=true&continent=Asia&search=india
   */
  @Get('countries')
  @AdminAction({ action: 'content.countries.list', category: 'content' })
  async getCountries(@Query() query: GetCountriesQueryDto) {
    const result = await this.countriesService.getCountries(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Countries retrieved successfully',
      data: result,
    };
  }

  /**
   * Get country by ID
   * GET /admin/content/countries/:id
   */
  @Get('countries/:id')
  @AdminAction({ action: 'content.countries.view', category: 'content' })
  async getCountryById(@Param('id') id: string) {
    const country = await this.countriesService.getCountryById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Country retrieved successfully',
      data: country,
    };
  }

  /**
   * Create a new country
   * POST /admin/content/countries
   */
  @Post('countries')
  @AdminAction({ action: 'content.countries.create', category: 'content' })
  async createCountry(@Body() dto: CreateCountryDto) {
    const country = await this.countriesService.createCountry(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Country created successfully',
      data: country,
    };
  }

  /**
   * Update an existing country
   * PATCH /admin/content/countries/:id
   */
  @Patch('countries/:id')
  @AdminAction({ action: 'content.countries.update', category: 'content' })
  async updateCountry(
    @Param('id') id: string,
    @Body() dto: UpdateCountryDto,
  ) {
    const country = await this.countriesService.updateCountry(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Country updated successfully',
      data: country,
    };
  }

  /**
   * Delete a country
   * DELETE /admin/content/countries/:id
   */
  @Delete('countries/:id')
  @AdminAction({ action: 'content.countries.delete', category: 'content' })
  async deleteCountry(@Param('id') id: string) {
    await this.countriesService.deleteCountry(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Country deleted successfully',
    };
  }

  /**
   * Seed default countries
   * POST /admin/content/countries/seed
   */
  @Post('countries/seed')
  @AdminAction({ action: 'content.countries.seed', category: 'content' })
  async seedCountries() {
    const result = await this.countriesService.seedDefaultCountries();
    return {
      statusCode: HttpStatus.OK,
      message: `Seeded countries: ${result.created} created, ${result.skipped} skipped`,
      data: result,
    };
  }

  // ============================================
  // PORTS
  // ============================================

  /**
   * Get ports with optional filters and pagination
   * GET /admin/content/ports?isActive=true&country=id&type=sea&search=mumbai
   */
  @Get('ports')
  @AdminAction({ action: 'content.ports.list', category: 'content' })
  async getPorts(@Query() query: GetPortsQueryDto) {
    const result = await this.portsService.getPorts(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Ports retrieved successfully',
      data: result,
    };
  }

  /**
   * Get port by ID
   * GET /admin/content/ports/:id
   */
  @Get('ports/:id')
  @AdminAction({ action: 'content.ports.view', category: 'content' })
  async getPortById(@Param('id') id: string) {
    const port = await this.portsService.getPortById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Port retrieved successfully',
      data: port,
    };
  }

  /**
   * Get ports by country
   * GET /admin/content/ports/country/:countryId
   */
  @Get('ports/country/:countryId')
  @AdminAction({ action: 'content.ports.list', category: 'content' })
  async getPortsByCountry(@Param('countryId') countryId: string) {
    const result = await this.portsService.getPortsByCountry(countryId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Ports retrieved successfully',
      data: result,
    };
  }

  /**
   * Create a new port
   * POST /admin/content/ports
   */
  @Post('ports')
  @AdminAction({ action: 'content.ports.create', category: 'content' })
  async createPort(@Body() dto: CreatePortDto) {
    const port = await this.portsService.createPort(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Port created successfully',
      data: port,
    };
  }

  /**
   * Update an existing port
   * PATCH /admin/content/ports/:id
   */
  @Patch('ports/:id')
  @AdminAction({ action: 'content.ports.update', category: 'content' })
  async updatePort(@Param('id') id: string, @Body() dto: UpdatePortDto) {
    const port = await this.portsService.updatePort(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Port updated successfully',
      data: port,
    };
  }

  /**
   * Delete a port
   * DELETE /admin/content/ports/:id
   */
  @Delete('ports/:id')
  @AdminAction({ action: 'content.ports.delete', category: 'content' })
  async deletePort(@Param('id') id: string) {
    await this.portsService.deletePort(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Port deleted successfully',
    };
  }

  /**
   * Seed default ports
   * POST /admin/content/ports/seed
   */
  @Post('ports/seed')
  @AdminAction({ action: 'content.ports.seed', category: 'content' })
  async seedPorts() {
    const result = await this.portsService.seedDefaultPorts();
    return {
      statusCode: HttpStatus.OK,
      message: `Seeded ports: ${result.created} created, ${result.skipped} skipped`,
      data: result,
    };
  }

  // ============================================
  // HSN CODES
  // ============================================

  /**
   * Get HSN codes with filters and pagination
   * GET /admin/content/hsn-codes?search=0101&category=&page=1&limit=50
   */
  @Get('hsn-codes')
  @AdminAction({ action: 'content.hsn.list', category: 'content' })
  async getHSNCodes(@Query() query: GetHSNCodesQueryDto) {
    const result = await this.hsnCodesService.getHSNCodes(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'HSN codes retrieved successfully',
      data: result,
    };
  }

  /**
   * Get HSN code statistics
   * GET /admin/content/hsn-codes/stats
   */
  @Get('hsn-codes/stats')
  @AdminAction({ action: 'content.hsn.stats', category: 'content' })
  async getHSNStats() {
    const stats = await this.hsnCodesService.getStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'HSN statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get all unique HSN categories
   * GET /admin/content/hsn-codes/categories
   */
  @Get('hsn-codes/categories')
  @AdminAction({ action: 'content.hsn.categories', category: 'content' })
  async getHSNCategories() {
    const categories = await this.hsnCodesService.getCategories();
    return {
      statusCode: HttpStatus.OK,
      message: 'HSN categories retrieved successfully',
      data: categories,
    };
  }

  /**
   * Search HSN codes (for autocomplete)
   * GET /admin/content/hsn-codes/search?q=fertilizer&limit=20
   */
  @Get('hsn-codes/search')
  @AdminAction({ action: 'content.hsn.search', category: 'content' })
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
   * Get HSN code by ID
   * GET /admin/content/hsn-codes/:id
   */
  @Get('hsn-codes/:id')
  @AdminAction({ action: 'content.hsn.view', category: 'content' })
  async getHSNCodeById(@Param('id') id: string) {
    const hsn = await this.hsnCodesService.getHSNCodeById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'HSN code retrieved successfully',
      data: hsn,
    };
  }

  /**
   * Create a new HSN code
   * POST /admin/content/hsn-codes
   */
  @Post('hsn-codes')
  @AdminAction({ action: 'content.hsn.create', category: 'content' })
  async createHSNCode(@Body() dto: CreateHSNCodeDto) {
    const hsn = await this.hsnCodesService.createHSNCode(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'HSN code created successfully',
      data: hsn,
    };
  }

  /**
   * Bulk import HSN codes from CSV
   * POST /admin/content/hsn-codes/bulk-import
   * Body: { data: [{ code, description, category? }], skipDuplicates?: boolean }
   */
  @Post('hsn-codes/bulk-import')
  @AdminAction({ action: 'content.hsn.bulk_import', category: 'content' })
  async bulkImportHSNCodes(
    @Body() body: { data: Array<{ code: string; description: string; category?: string }>; skipDuplicates?: boolean },
  ) {
    if (!body.data || !Array.isArray(body.data)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid data format. Expected array of { code, description, category? }',
      };
    }

    const result = await this.hsnCodesService.bulkImportHSNCodes(
      body.data,
      body.skipDuplicates !== false, // Default to true
    );

    return {
      statusCode: HttpStatus.OK,
      message: `Import completed: ${result.success} created, ${result.failed} failed`,
      data: result,
    };
  }

  /**
   * Update an existing HSN code
   * PATCH /admin/content/hsn-codes/:id
   */
  @Patch('hsn-codes/:id')
  @AdminAction({ action: 'content.hsn.update', category: 'content' })
  async updateHSNCode(@Param('id') id: string, @Body() dto: UpdateHSNCodeDto) {
    const hsn = await this.hsnCodesService.updateHSNCode(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'HSN code updated successfully',
      data: hsn,
    };
  }

  /**
   * Delete an HSN code
   * DELETE /admin/content/hsn-codes/:id
   */
  @Delete('hsn-codes/:id')
  @AdminAction({ action: 'content.hsn.delete', category: 'content' })
  async deleteHSNCode(@Param('id') id: string) {
    await this.hsnCodesService.deleteHSNCode(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'HSN code deleted successfully',
    };
  }

  // ============================================
  // CATEGORIES
  // ============================================

  /**
   * Get categories with optional filters
   * GET /admin/content/categories?isActive=true&rootOnly=true&parent=id
   */
  @Get('categories')
  @AdminAction({ action: 'content.categories.list', category: 'content' })
  async getCategories(@Query() query: GetCategoriesQueryDto) {
    const result = await this.categoriesService.getCategories(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Categories retrieved successfully',
      data: result,
    };
  }

  /**
   * Get category tree structure
   * GET /admin/content/categories/tree
   */
  @Get('categories/tree')
  @AdminAction({ action: 'content.categories.tree', category: 'content' })
  async getCategoryTree() {
    const result = await this.categoriesService.getCategoryTree();
    return {
      statusCode: HttpStatus.OK,
      message: 'Category tree retrieved successfully',
      data: result,
    };
  }

  /**
   * Get category by ID
   * GET /admin/content/categories/:id
   */
  @Get('categories/:id')
  @AdminAction({ action: 'content.categories.view', category: 'content' })
  async getCategoryById(@Param('id') id: string) {
    const category = await this.categoriesService.getCategoryById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  /**
   * Get children of a category
   * GET /admin/content/categories/:id/children
   */
  @Get('categories/:id/children')
  @AdminAction({ action: 'content.categories.children', category: 'content' })
  async getCategoryChildren(@Param('id') id: string) {
    const children = await this.categoriesService.getChildren(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category children retrieved successfully',
      data: children,
    };
  }

  /**
   * Create a new category
   * POST /admin/content/categories
   */
  @Post('categories')
  @AdminAction({ action: 'content.categories.create', category: 'content' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.createCategory(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Category created successfully',
      data: category,
    };
  }

  /**
   * Update an existing category
   * PATCH /admin/content/categories/:id
   */
  @Patch('categories/:id')
  @AdminAction({ action: 'content.categories.update', category: 'content' })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const category = await this.categoriesService.updateCategory(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category updated successfully',
      data: category,
    };
  }

  /**
   * Delete a category (soft delete)
   * DELETE /admin/content/categories/:id
   */
  @Delete('categories/:id')
  @AdminAction({ action: 'content.categories.delete', category: 'content' })
  async deleteCategory(@Param('id') id: string) {
    await this.categoriesService.deleteCategory(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category deleted successfully',
    };
  }

  /**
   * Reorder a category
   * POST /admin/content/categories/reorder
   */
  @Post('categories/reorder')
  @AdminAction({ action: 'content.categories.reorder', category: 'content' })
  async reorderCategory(@Body() dto: ReorderCategoryDto) {
    const result = await this.categoriesService.reorderCategory(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category reordered successfully',
      data: result,
    };
  }

  /**
   * Seed default categories
   * POST /admin/content/categories/seed
   */
  @Post('categories/seed')
  @AdminAction({ action: 'content.categories.seed', category: 'content' })
  async seedCategories() {
    const result = await this.categoriesService.seedDefaultCategories();
    return {
      statusCode: HttpStatus.OK,
      message: `Seeded categories: ${result.created} created, ${result.skipped} skipped`,
      data: result,
    };
  }

  /**
   * Seed mainstream classification for existing leaf categories
   * Sets isMainstream=true for all leaf categories that haven't been classified yet
   * POST /admin/content/categories/seed-mainstream
   */
  @Post('categories/seed-mainstream')
  @AdminAction({ action: 'content.categories.seed_mainstream', category: 'content' })
  async seedMainstreamClassification() {
    const result = await this.categoriesService.seedMainstreamClassification();
    return {
      statusCode: HttpStatus.OK,
      message: `Seeded mainstream classification: ${result.updated} categories updated`,
      data: result,
    };
  }

  // ----------------------------------------
  // Category Classification (Mainstream/Niche)
  // ----------------------------------------

  /**
   * Toggle mainstream/niche classification for a category
   * POST /admin/content/categories/:id/toggle-mainstream
   */
  @Post('categories/:id/toggle-mainstream')
  @AdminAction({ action: 'content.categories.toggle_mainstream', category: 'content' })
  async toggleCategoryMainstream(
    @Param('id') id: string,
    @Body() dto: ToggleMainstreamDto,
  ) {
    const category = await this.categoriesService.toggleMainstreamStatus(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: `Category is now ${category.isMainstream ? 'mainstream' : 'niche'}`,
      data: category,
    };
  }

  /**
   * Get categories grouped by mainstream/niche classification
   * GET /admin/content/categories/grouped-classification
   */
  @Get('categories/grouped-classification')
  @AdminAction({ action: 'content.categories.grouped', category: 'content' })
  async getCategoriesGroupedByClassification() {
    const result = await this.categoriesService.getCategoriesGroupedByClassification();
    return {
      statusCode: HttpStatus.OK,
      message: 'Categories grouped by classification retrieved successfully',
      data: result,
    };
  }

  /**
   * Get pending user-submitted categories for admin review
   * GET /admin/content/categories/pending
   */
  @Get('categories/pending')
  @AdminAction({ action: 'content.categories.pending', category: 'content' })
  async getPendingCategories() {
    const result = await this.categoriesService.getPendingUserCategories();
    return {
      statusCode: HttpStatus.OK,
      message: 'Pending categories retrieved successfully',
      data: result,
    };
  }

  /**
   * Approve a user-submitted category with optional edits
   * POST /admin/content/categories/:id/approve
   * Body can include: name, parentId, isMainstream, aliases, hsCodePrefix
   */
  @Post('categories/:id/approve')
  @AdminAction({ action: 'content.categories.approve', category: 'content' })
  async approveCategory(
    @Param('id') id: string,
    @Body() dto?: ApproveCategoryDto,
  ) {
    const category = await this.categoriesService.approveUserCategory(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category approved successfully',
      data: category,
    };
  }

  /**
   * Get commodity/category classification stats
   * GET /admin/content/categories/commodity-stats
   */
  @Get('categories/commodity-stats')
  @AdminAction({ action: 'content.categories.commodity_stats', category: 'content' })
  async getCommodityStatsForCategories() {
    const stats = await this.categoriesService.getCommodityStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Commodity classification stats retrieved successfully',
      data: stats,
    };
  }

  // ============================================
  // INCOTERMS
  // ============================================

  /**
   * Get all incoterms with optional transport mode filter
   * GET /admin/content/incoterms?transportMode=sea_inland
   */
  @Get('incoterms')
  @AdminAction({ action: 'content.incoterms.list', category: 'content' })
  async getIncoterms(@Query() query: GetIncotermsQueryDto) {
    const result = await this.incotermsService.getIncoterms(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Incoterms retrieved successfully',
      data: result,
    };
  }

  /**
   * Get available incoterm codes
   * GET /admin/content/incoterms/codes
   */
  @Get('incoterms/codes')
  @AdminAction({ action: 'content.incoterms.codes', category: 'content' })
  getIncotermCodes() {
    const codes = this.incotermsService.getIncotermCodes();
    return {
      statusCode: HttpStatus.OK,
      message: 'Incoterm codes retrieved successfully',
      data: codes,
    };
  }

  /**
   * Get incoterm by code
   * GET /admin/content/incoterms/:code
   */
  @Get('incoterms/:code')
  @AdminAction({ action: 'content.incoterms.view', category: 'content' })
  async getIncotermByCode(@Param('code') code: string) {
    const incoterm = await this.incotermsService.getIncotermByCode(code);
    return {
      statusCode: HttpStatus.OK,
      message: 'Incoterm retrieved successfully',
      data: incoterm,
    };
  }

  /**
   * Update an incoterm (name, description, cost allocation)
   * PATCH /admin/content/incoterms/:code
   * Note: Cannot create or delete incoterms - fixed 11 types
   */
  @Patch('incoterms/:code')
  @AdminAction({ action: 'content.incoterms.update', category: 'content' })
  async updateIncoterm(
    @Param('code') code: string,
    @Body() dto: UpdateIncotermDto,
  ) {
    const incoterm = await this.incotermsService.updateIncoterm(code, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Incoterm updated successfully',
      data: incoterm,
    };
  }

  /**
   * Seed all 11 standard Incoterms 2020
   * POST /admin/content/incoterms/seed
   */
  @Post('incoterms/seed')
  @AdminAction({ action: 'content.incoterms.seed', category: 'content' })
  async seedIncoterms() {
    const result = await this.incotermsService.seedDefaultIncoterms();
    return {
      statusCode: HttpStatus.OK,
      message: `Seeded incoterms: ${result.created} created, ${result.skipped} skipped`,
      data: result,
    };
  }

  /**
   * Reset all incoterms to their default values
   * POST /admin/content/incoterms/reset
   * Warning: This will overwrite any customizations
   */
  @Post('incoterms/reset')
  @AdminAction({ action: 'content.incoterms.reset', category: 'content' })
  async resetIncoterms() {
    const result = await this.incotermsService.resetToDefaults();
    return {
      statusCode: HttpStatus.OK,
      message: `Reset incoterms: ${result.updated} updated to defaults`,
      data: result,
    };
  }

  // ============================================
  // COMMODITIES - REMOVED (merged into Categories)
  // Use /admin/content/categories/* endpoints with isMainstream filter
  // ============================================

  // ============================================
  // UNITS OF MEASUREMENT
  // ============================================

  /**
   * Get all units with optional filters
   * GET /admin/content/units?isActive=true&type=weight&search=kg
   */
  @Get('units')
  @AdminAction({ action: 'content.units.list', category: 'content' })
  async getUnits(@Query() query: GetUnitsQueryDto) {
    const result = await this.unitsService.getUnits(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Units retrieved successfully',
      data: result,
    };
  }

  /**
   * Get unit statistics
   * GET /admin/content/units/stats
   */
  @Get('units/stats')
  @AdminAction({ action: 'content.units.stats', category: 'content' })
  async getUnitStats() {
    const stats = await this.unitsService.getStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Unit statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get units grouped by type
   * GET /admin/content/units/grouped
   */
  @Get('units/grouped')
  @AdminAction({ action: 'content.units.grouped', category: 'content' })
  async getUnitsGrouped() {
    const grouped = await this.unitsService.getUnitsGrouped();
    return {
      statusCode: HttpStatus.OK,
      message: 'Grouped units retrieved successfully',
      data: grouped,
    };
  }

  /**
   * Get available unit types
   * GET /admin/content/units/types
   */
  @Get('units/types')
  @AdminAction({ action: 'content.units.types', category: 'content' })
  getUnitTypes() {
    const types = this.unitsService.getUnitTypes();
    return {
      statusCode: HttpStatus.OK,
      message: 'Unit types retrieved successfully',
      data: types,
    };
  }

  /**
   * Get unit by ID
   * GET /admin/content/units/:id
   */
  @Get('units/:id')
  @AdminAction({ action: 'content.units.view', category: 'content' })
  async getUnitById(@Param('id') id: string) {
    const unit = await this.unitsService.getUnitById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Unit retrieved successfully',
      data: unit,
    };
  }

  /**
   * Get unit by code
   * GET /admin/content/units/code/:code
   */
  @Get('units/code/:code')
  @AdminAction({ action: 'content.units.view', category: 'content' })
  async getUnitByCode(@Param('code') code: string) {
    const unit = await this.unitsService.getUnitByCode(code);
    return {
      statusCode: HttpStatus.OK,
      message: 'Unit retrieved successfully',
      data: unit,
    };
  }

  /**
   * Create a new unit
   * POST /admin/content/units
   */
  @Post('units')
  @AdminAction({ action: 'content.units.create', category: 'content' })
  async createUnit(@Body() dto: CreateUnitDto) {
    const unit = await this.unitsService.createUnit(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Unit created successfully',
      data: unit,
    };
  }

  /**
   * Seed default units
   * POST /admin/content/units/seed
   */
  @Post('units/seed')
  @AdminAction({ action: 'content.units.seed', category: 'content' })
  async seedUnits() {
    const result = await this.unitsService.seedDefaultUnits();
    return {
      statusCode: HttpStatus.OK,
      message: `Seeded units: ${result.created} created, ${result.skipped} skipped`,
      data: result,
    };
  }

  /**
   * Update an existing unit
   * PATCH /admin/content/units/:id
   */
  @Patch('units/:id')
  @AdminAction({ action: 'content.units.update', category: 'content' })
  async updateUnit(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    const unit = await this.unitsService.updateUnit(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Unit updated successfully',
      data: unit,
    };
  }

  /**
   * Delete a unit
   * DELETE /admin/content/units/:id
   */
  @Delete('units/:id')
  @AdminAction({ action: 'content.units.delete', category: 'content' })
  async deleteUnit(@Param('id') id: string) {
    await this.unitsService.deleteUnit(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Unit deleted successfully',
    };
  }

  // ============================================
  // CONTENT STATS (OVERVIEW)
  // ============================================

  /**
   * Get overall content statistics for dashboard
   * GET /admin/content/stats
   */
  @Get('stats')
  @AdminAction({ action: 'content.stats', category: 'content' })
  async getContentStats() {
    const [
      currenciesData,
      countriesData,
      portsData,
      categoriesData,
      hsnData,
      incotermsData,
      commodityStats,
      unitsData,
    ] = await Promise.all([
      this.currenciesService.getCurrencies({}),
      this.countriesService.getCountries({}),
      this.portsService.getPorts({ limit: 1 }),
      this.categoriesService.getCategories({}),
      this.hsnCodesService.getStats(),
      this.incotermsService.getIncoterms({}),
      this.categoriesService.getCommodityStats(), // Get commodity stats from categories
      this.unitsService.getStats(),
    ]);

    // Calculate active counts
    const activeCurrencies = currenciesData.currencies.filter((c: any) => c.isActive).length;
    const activeCountries = countriesData.countries.filter((c: any) => c.isActive).length;

    return {
      statusCode: HttpStatus.OK,
      message: 'Content statistics retrieved successfully',
      data: {
        currencies: {
          total: currenciesData.total,
          active: activeCurrencies,
        },
        countries: {
          total: countriesData.total,
          active: activeCountries,
        },
        ports: {
          total: portsData.total,
          byType: {
            sea: 0, // Would need aggregation to get this
            air: 0,
            land: 0,
          },
        },
        categories: {
          total: categoriesData.total,
          byLevel: [0, 0, 0], // Would need aggregation
        },
        hsnCodes: {
          total: hsnData.total,
        },
        incoterms: {
          total: incotermsData.total,
        },
        commodities: {
          total: commodityStats.total,
          mainstream: commodityStats.mainstream,
          niche: commodityStats.niche,
        },
        units: {
          total: unitsData.total,
          active: unitsData.active,
        },
      },
    };
  }
}
