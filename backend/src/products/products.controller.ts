import {
  Controller,
  Query,
  Get,
  Res,
  Post,
  Body,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { HSN } from './schema/hsn.schema';
import { ProductsService } from './products.service';
import { Response } from 'express';
import { CreateProductDto } from './create-product.dto';
import { FileUploadInterceptor } from './file-upload.interceptor';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/auth.guard';

/**
 * Products Controller
 * All routes are protected by AuthGuard which validates:
 * - Cookie-based JWT authentication
 * - User existence in database
 * - User is not suspended
 */
@Controller('products')
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly authService: AuthService,
  ) {}

  @Get('hsn')
  async search(
    @Query('q') query: string,
    @Res() response: Response,
  ): Promise<HSN[]> {
    const accountToken = response.req.signedCookies['account'];
    if (!accountToken) {
      response.status(401).send('No valid cookie found');
    }

    if (!query) {
      response.status(400).json({ error: 'Query parameter "q" is required' });
      return [];
    }
    const results = await this.productsService.search(query);
    response.json(results);
    return results;
  }

  @Post('add-product')
  @UseInterceptors(FileUploadInterceptor)
  async createProduct(
    @Res() response: Response,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    try {
      // Extract the account token from the signed cookies
      const accountToken = response.req.signedCookies['account'];

      // If accountToken is not present, return 401 Unauthorized
      if (!accountToken) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
      }

      // Verify JWT token and extract user ID
      let userId: string;
      try {
        const decoded = this.authService.validateAccountToken(accountToken);
        userId = (decoded as any).userId;
      } catch (error) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
      }

      // Parse product data from form data
      let createProductDto: CreateProductDto;
      try {
        createProductDto = JSON.parse(body.productData);
      } catch (error) {
        return response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid product data format',
        });
      }

      // Handle file uploads if files are provided
      if (files && files.length > 0) {
        const { productImages, testReports } =
          await this.productsService.uploadFiles(files);
        createProductDto.productImages = productImages;
        createProductDto.testReports = testReports;
      }

      // Call the service to create the product
      const result = await this.productsService.createProduct(
        createProductDto,
        userId,
      );

      // Send the success response with the created product
      return response.status(HttpStatus.CREATED).send({
        statusCode: HttpStatus.CREATED,
        message: 'Product created successfully',
        data: result,
      });
    } catch (error) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create product',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Get('user-products')
  async getUserProducts(
    @Query('page') page: string = '',
    @Query('limit') limit: string = '',
    @Query('search') search: string = '',
    @Query('category') category: string = '',
    @Query('stockStatus') stockStatus: string = '',
    @Query('sort') sort: string = '',
    @Query('isMainstream') isMainstreamStr: string = '',
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
      }

      let userId: string;
      try {
        const decoded = this.authService.validateAccountToken(accountToken);
        userId = (decoded as any).userId;
      } catch (error) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
      }

      if (
        page ||
        limit ||
        search ||
        category ||
        stockStatus ||
        sort ||
        isMainstreamStr
      ) {
        const pageNum = parseInt(page || '1', 10);
        const limitNum = parseInt(limit || '10', 10);
        // Parse isMainstream query parameter (string 'true'/'false' to boolean)
        const isMainstream =
          isMainstreamStr === '' ? undefined : isMainstreamStr === 'true';

        const result =
          await this.productsService.getProductsByUserWithPagination(userId, {
            page: pageNum,
            limit: limitNum,
            search,
            category,
            stockStatus,
            sort,
            isMainstream,
          });

        return response.status(HttpStatus.OK).send({
          statusCode: HttpStatus.OK,
          message: 'Products retrieved successfully',
          data: result.products,
          pagination: {
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            totalProducts: result.totalProducts,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage,
          },
          stats: result.stats,
        });
      }

      const products = await this.productsService.getProductsByUser(userId);

      return response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Products retrieved successfully',
        data: products,
      });
    } catch (error) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve products',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Get('list')
  async getProducts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '30',
    @Query('search') search: string = '',
    @Query('category') category: string = '',
    @Query('minPrice') minPrice: string = '',
    @Query('maxPrice') maxPrice: string = '',
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
      }

      let userId: string;
      try {
        const decoded = this.authService.validateAccountToken(accountToken);
        userId = (decoded as any).userId;
      } catch (error) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      const result = await this.productsService.getProductsWithPagination({
        page: pageNum,
        limit: limitNum,
        search,
        category,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      });

      return response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Products retrieved successfully',
        data: result.products,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalProducts: result.totalProducts,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
      });
    } catch (error) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve products',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  /**
   * Get products by company ID
   * Returns all active products from the specified company with pagination
   */
  @Get('company/:companyId')
  async getProductsByCompanyId(
    @Param('companyId') companyId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query('search') search: string = '',
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
      }

      try {
        this.authService.validateAccountToken(accountToken);
      } catch (error) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 12;

      const result = await this.productsService.getProductsByCompanyId(
        companyId,
        {
          page: pageNum,
          limit: limitNum,
          search: search || undefined,
        },
      );

      return response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Products retrieved successfully',
        data: result.products,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalProducts: result.totalProducts,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).send({
        statusCode: status,
        message: error.message || 'Failed to retrieve products',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Get(':id')
  async getProductById(@Param('id') id: string, @Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
      }

      try {
        const decoded = this.authService.validateAccountToken(accountToken);
        // We don't need userId for this endpoint as buyers should see all products
      } catch (error) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
      }

      const product = await this.productsService.getProductByIdWithCompany(id);

      if (!product) {
        return response.status(HttpStatus.NOT_FOUND).send({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Product not found',
        });
      }

      return response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Product retrieved successfully',
        data: product,
      });
    } catch (error) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve product',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  /**
   * Track a product view for analytics
   * Called when a buyer views a product page
   * Does not count self-views (seller viewing their own product)
   */
  @Post(':id/view')
  async trackProductView(@Param('id') id: string, @Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
      }

      let companyId: string;
      try {
        const decoded = this.authService.validateAccountToken(accountToken);
        companyId = (decoded as any).companyId;
      } catch (error) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
      }

      const result = await this.productsService.trackProductView(id, companyId);

      return response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: result.success
          ? 'View tracked successfully'
          : 'View not tracked (self-view or error)',
        data: result,
      });
    } catch (error) {
      // View tracking should fail silently - it's not critical
      return response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'View tracking skipped',
        data: { success: false },
      });
    }
  }

  @Patch(':id')
  @UseInterceptors(FileUploadInterceptor)
  async updateProduct(
    @Param('id') id: string,
    @Res() response: Response,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
      }

      let userId: string;
      try {
        const decoded = this.authService.validateAccountToken(accountToken);
        userId = (decoded as any).userId;
      } catch (error) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
      }

      let updateProductDto: CreateProductDto;
      try {
        updateProductDto = JSON.parse(body.productData);
      } catch (error) {
        return response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid product data format',
        });
      }

      const result = await this.productsService.updateProduct(
        id,
        userId,
        updateProductDto,
        files,
      );

      if (!result) {
        return response.status(HttpStatus.NOT_FOUND).send({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Product not found',
        });
      }

      return response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Product updated successfully',
        data: result,
      });
    } catch (error) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update product',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Patch(':id/visibility')
  async updateProductVisibility(
    @Param('id') id: string,
    @Res() response: Response,
    @Body('isActive') isActive: boolean,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
      }

      let userId: string;
      try {
        const decoded = this.authService.validateAccountToken(accountToken);
        userId = (decoded as any).userId;
      } catch (error) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
      }

      if (typeof isActive !== 'boolean') {
        return response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'isActive must be a boolean',
        });
      }

      const result = await this.productsService.updateProductVisibility(
        id,
        userId,
        isActive,
      );

      if (!result) {
        return response.status(HttpStatus.NOT_FOUND).send({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Product not found',
        });
      }

      return response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Product visibility updated successfully',
        data: result,
      });
    } catch (error) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update product visibility',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string, @Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
      }

      let userId: string;
      try {
        const decoded = this.authService.validateAccountToken(accountToken);
        userId = (decoded as any).userId;
      } catch (error) {
        return response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
      }

      const deleted = await this.productsService.deleteProduct(id, userId);
      if (!deleted) {
        return response.status(HttpStatus.NOT_FOUND).send({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Product not found',
        });
      }

      return response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete product',
        error: error.message || 'Internal Server Error',
      });
    }
  }
}
