import { Controller, Get, Post, Body, Param, Put, Delete, Request, Logger, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);
  private defaultSellerId = '1'; // Default seller ID for development

  constructor(private readonly productsService: ProductsService) {}

  // Public endpoint - no authentication required
  @Get()
  async findAll(@Request() req): Promise<Product[]> {
    try {
      this.logger.log('GET /products request received');
      const sellerId = req.user?.id; // Will be undefined for non-authenticated requests
      
      // Only filter by seller if authenticated and requesting own products
      return await this.productsService.findAll(sellerId);
    } catch (error) {
      this.logger.error('Error in findAll', error);
      throw new HttpException(
        'Failed to fetch products',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Authenticated endpoint to get current seller's products
  @Get('seller/me')
  @UseGuards(JwtAuthGuard)
  async findCurrentSellerProducts(@Request() req): Promise<Product[]> {
    try {
      this.logger.log('GET /products/seller/me request received');
      const sellerId = req.user?.id;
      
      if (!sellerId) {
        this.logger.warn('No seller ID found in JWT token');
        throw new HttpException(
          'Authentication required',
          HttpStatus.UNAUTHORIZED
        );
      }
      
      this.logger.log(`Fetching products for seller ID: ${sellerId}`);
      const products = await this.productsService.findAll(sellerId);
      this.logger.log(`Found ${products.length} products for seller ID: ${sellerId}`);
      
      return products;
    } catch (error) {
      this.logger.error(`Error in findCurrentSellerProducts: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch seller products',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Public endpoint - no authentication required
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<Product> {
    try {
      this.logger.log(`GET /products/${id} request received`);
      const product = await this.productsService.findOne(id);
      return product;
    } catch (error) {
      this.logger.error(`Error in findOne(${id})`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch product',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Requires authentication
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createProductDto: CreateProductDto, @Request() req): Promise<Product> {
    try {
      this.logger.log('POST /products request received');
      // Use authenticated user's ID as seller ID
      const sellerId = req.user?.id;
      
      if (!sellerId) {
        throw new HttpException(
          'Authentication required',
          HttpStatus.UNAUTHORIZED
        );
      }
      
      return await this.productsService.create(createProductDto, sellerId);
    } catch (error) {
      this.logger.error('Error in create', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create product',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Requires authentication
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto,
    @Request() req
  ): Promise<Product> {
    try {
      this.logger.log(`PUT /products/${id} request received`);
      // First, check if user is authorized to update this product
      const product = await this.productsService.findOne(id);
      const userId = req.user?.id;
      
      if (product.sellerId && product.sellerId !== userId) {
        throw new HttpException(
          'You are not authorized to update this product',
          HttpStatus.FORBIDDEN
        );
      }
      
      return await this.productsService.update(id, updateProductDto);
    } catch (error) {
      this.logger.error(`Error in update(${id})`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update product',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Requires authentication
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    try {
      this.logger.log(`DELETE /products/${id} request received`);
      // First, check if user is authorized to delete this product
      const product = await this.productsService.findOne(id);
      const userId = req.user?.id;
      
      if (product.sellerId && product.sellerId !== userId) {
        throw new HttpException(
          'You are not authorized to delete this product',
          HttpStatus.FORBIDDEN
        );
      }
      
      await this.productsService.remove(id);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      this.logger.error(`Error in remove(${id})`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete product',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 