import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles('seller')
  async findAll(@Request() req): Promise<Product[]> {
    try {
      this.logger.log('GET /products request received');
      return await this.productsService.findAll(req.user.id);
    } catch (error) {
      this.logger.error('Error in findAll', error);
      throw new HttpException(
        'Failed to fetch products',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @Roles('seller')
  async findOne(@Param('id') id: string, @Request() req): Promise<Product> {
    try {
      this.logger.log(`GET /products/${id} request received`);
      const product = await this.productsService.findOne(id);
      
      // Check if the product belongs to the seller
      if (product.sellerId !== req.user.id) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
      
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

  @Post()
  @Roles('seller')
  async create(@Body() createProductDto: CreateProductDto, @Request() req): Promise<Product> {
    try {
      this.logger.log('POST /products request received');
      return await this.productsService.create(createProductDto, req.user.id);
    } catch (error) {
      this.logger.error('Error in create', error);
      throw new HttpException(
        'Failed to create product',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  @Roles('seller')
  async update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto,
    @Request() req
  ): Promise<Product> {
    try {
      this.logger.log(`PUT /products/${id} request received`);
      // Check if the product belongs to the seller
      const product = await this.productsService.findOne(id);
      if (product.sellerId !== req.user.id) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
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

  @Delete(':id')
  @Roles('seller')
  async remove(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    try {
      this.logger.log(`DELETE /products/${id} request received`);
      // Check if the product belongs to the seller
      const product = await this.productsService.findOne(id);
      if (product.sellerId !== req.user.id) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
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