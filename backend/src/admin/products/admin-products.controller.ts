import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../common/decorators/admin-action.decorator';
import { GetProductsQueryDto, DeactivateProductDto } from './dto';

@Controller('admin/products')
@UseGuards(AdminAuthGuard)
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  /**
   * Get paginated list of products with filters
   * GET /admin/products?page=1&limit=20&search=&category=&isActive=&isDeactivated=&isFeatured=
   */
  @Get()
  @AdminAction({ action: 'product.list', category: 'products' })
  async getProducts(@Query() query: GetProductsQueryDto) {
    const result = await this.adminProductsService.getProducts(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Products retrieved successfully',
      data: result,
    };
  }

  /**
   * Get product statistics
   * GET /admin/products/stats
   */
  @Get('stats')
  async getProductStats() {
    const stats = await this.adminProductsService.getProductStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Product statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get all unique categories
   * GET /admin/products/categories
   */
  @Get('categories')
  async getCategories() {
    const categories = await this.adminProductsService.getCategories();
    return {
      statusCode: HttpStatus.OK,
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  /**
   * Get product by ID
   * GET /admin/products/:id
   */
  @Get(':id')
  @AdminAction({ action: 'product.view', category: 'products' })
  async getProductById(@Param('id') id: string) {
    const product = await this.adminProductsService.getProductById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  /**
   * Deactivate a product (admin moderation)
   * PUT /admin/products/:id/deactivate
   */
  @Put(':id/deactivate')
  @AdminAction({ action: 'product.deactivate', category: 'products' })
  async deactivateProduct(
    @Param('id') id: string,
    @Body() deactivateDto: DeactivateProductDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const product = await this.adminProductsService.deactivateProduct(
      id,
      deactivateDto.reason,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Product deactivated successfully',
      data: product,
    };
  }

  /**
   * Reactivate a product
   * PUT /admin/products/:id/reactivate
   */
  @Put(':id/reactivate')
  @AdminAction({ action: 'product.reactivate', category: 'products' })
  async reactivateProduct(@Param('id') id: string, @Req() req: any) {
    const admin = req.admin;
    const product = await this.adminProductsService.reactivateProduct(
      id,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Product reactivated successfully',
      data: product,
    };
  }

  /**
   * Feature a product
   * PUT /admin/products/:id/feature
   */
  @Put(':id/feature')
  @AdminAction({ action: 'product.feature', category: 'products' })
  async featureProduct(@Param('id') id: string, @Req() req: any) {
    const admin = req.admin;
    const product = await this.adminProductsService.featureProduct(
      id,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Product featured successfully',
      data: product,
    };
  }

  /**
   * Unfeature a product
   * PUT /admin/products/:id/unfeature
   */
  @Put(':id/unfeature')
  @AdminAction({ action: 'product.unfeature', category: 'products' })
  async unfeatureProduct(@Param('id') id: string, @Req() req: any) {
    const admin = req.admin;
    const product = await this.adminProductsService.unfeatureProduct(
      id,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Product unfeatured successfully',
      data: product,
    };
  }
}
