import { Controller, Get, Put, Body, UseGuards, Request, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SalesService } from './sales.service';
import { Sale } from './entities/sale.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  private readonly logger = new Logger(SalesController.name);

  constructor(private readonly salesService: SalesService) {}

  @Get()
  @Roles('seller')
  async getSales(@Request() req): Promise<Sale> {
    try {
      this.logger.log('GET /sales request received');
      return await this.salesService.findBySellerId(req.user.id);
    } catch (error) {
      this.logger.error('Error in getSales', error);
      throw new HttpException(
        'Failed to fetch sales data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put()
  @Roles('seller')
  async updateSales(@Body() updateData: Partial<Sale>, @Request() req): Promise<Sale> {
    try {
      this.logger.log('PUT /sales request received');
      // First get the seller's sales data
      const salesData = await this.salesService.findBySellerId(req.user.id);
      
      // Update it
      return await this.salesService.update(salesData.id, updateData);
    } catch (error) {
      this.logger.error('Error in updateSales', error);
      throw new HttpException(
        'Failed to update sales data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 