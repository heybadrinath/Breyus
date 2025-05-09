import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
  ) {}

  async findBySellerId(sellerId: string): Promise<Sale> {
    this.logger.log(`Finding sales data for seller ${sellerId}`);
    let salesData = await this.salesRepository.findOne({ where: { sellerId } });
    
    if (!salesData) {
      this.logger.log(`No sales data found for seller ${sellerId}, creating default data`);
      salesData = await this.createDefaultSalesData(sellerId);
    }
    
    return salesData;
  }

  async update(id: string, updateData: Partial<Sale>): Promise<Sale> {
    this.logger.log(`Updating sales data ${id}`);
    const salesData = await this.salesRepository.findOne({ where: { id } });
    
    if (!salesData) {
      this.logger.warn(`Sales data with ID ${id} not found`);
      throw new NotFoundException(`Sales data with ID ${id} not found`);
    }
    
    Object.assign(salesData, updateData);
    
    return this.salesRepository.save(salesData);
  }

  private async createDefaultSalesData(sellerId: string): Promise<Sale> {
    const defaultData = this.salesRepository.create({
      sellerId,
      totalAmount: 230220,
      totalSales: 230220,
      totalCustomers: 3200,
      averageRevenue: 1200,
      salesIncrease: 55,
      customersIncrease: 12,
      revenueIncrease: 35,
      averageRevenueIncrease: 213,
    });
    
    return this.salesRepository.save(defaultData);
  }
} 