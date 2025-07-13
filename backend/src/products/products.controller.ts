import { Controller, Query, Get, Res, Post, Body, HttpStatus, UseInterceptors, UploadedFiles, Param } from '@nestjs/common';
import { HSN } from './schema/hsn.schema';
import { ProductsService } from './products.service';
import { Response } from 'express';
import { CreateProductDto } from './create-product.dto';
import { FileUploadInterceptor } from './file-upload.interceptor';
import { AuthService } from '../auth/auth.service';


@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly authService: AuthService
    ) {}

    @Get('hsn')
    async search(@Query('q') query: string, @Res() response: Response): Promise<HSN[]> {
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
        @UploadedFiles() files?: Express.Multer.File[]
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
                const productImages: string[] = [];
                const testReports: string[] = [];

                for (const file of files) {
                    if (file.mimetype.startsWith('image/')) {
                        const imagePaths = await this.productsService.uploadFiles([file], 'product-images');
                        productImages.push(...imagePaths);
                    } else if (file.mimetype === 'application/pdf') {
                        const reportPaths = await this.productsService.uploadFiles([file], 'test-reports');
                        testReports.push(...reportPaths);
                    }
                }

                // Add file paths to the DTO
                createProductDto.productImages = productImages;
                createProductDto.testReports = testReports;
            }

            // Call the service to create the product
            const result = await this.productsService.createProduct(createProductDto, userId);

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
    async getUserProducts(@Res() response: Response) {
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
        @Res() response: Response
    ) {
        try {
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            
            const result = await this.productsService.getProductsWithPagination({
                page: pageNum,
                limit: limitNum,
                search,
                category,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
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
                    hasPrevPage: result.hasPrevPage
                }
            });
        } catch (error) {
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to retrieve products',
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

}