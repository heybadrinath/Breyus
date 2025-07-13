import { Controller, Query, Get, Res, Post, Body, HttpStatus } from '@nestjs/common';
import { HSN } from './schema/hsn.schema';
import { ProductsService } from './products.service';
import {Response} from 'express';
import { CreateProductDto } from './create-product.dto';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

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
  async createProduct(@Res() response: Response, @Body() createProductDto: CreateProductDto) {
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

      // Call the service to create the product
      const result = await this.productsService.createProduct(createProductDto);

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
}
