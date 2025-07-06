import { Controller, Query, Get, Res } from '@nestjs/common';
import { HSN } from './hsn.schema';
import { ProductsService } from './products.service';
import {Response} from 'express';

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
}
