import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BarGraph } from './entities/bar-graph.entity';
import { ScatterGraph } from './entities/scatter-graph.entity';
import { PieChart } from './entities/pie-chart.entity';
import { CountrySales } from './entities/country-sales.entity';

@Injectable()
export class SellerGraphService implements OnModuleInit {
  constructor(
    @InjectRepository(BarGraph)
    private barRepo: Repository<BarGraph>,

    @InjectRepository(ScatterGraph)
    private scatterRepo: Repository<ScatterGraph>,

    @InjectRepository(PieChart)
    private pieRepo: Repository<PieChart>,

    @InjectRepository(CountrySales)
    private countryRepo: Repository<CountrySales>,
  ) {}

  async onModuleInit() {
    // No initialization needed - data will be populated through API
  }

  async getBarGraph(seller_id: string) {
    return this.barRepo.find({ where: { seller_id } });
  }

  async getScatterGraph(seller_id: string) {
    return this.scatterRepo.find({ where: { seller_id } });
  }

  async getPieChart(seller_id: string) {
    return this.pieRepo.find({ where: { seller_id } });
  }

  async getCountrySales(seller_id: string) {
    return this.countryRepo.find({ where: { seller_id } });
  }

  async getMetrics(seller_id: string) {
    const [storeVisits, dailySales, pieData, countrySales] = await Promise.all([
      this.barRepo.find({ where: { seller_id } }),
      this.scatterRepo.find({ where: { seller_id } }),
      this.pieRepo.find({ where: { seller_id } }),
      this.countryRepo.find({ where: { seller_id } }),
    ]);

    return {
      totalVisits: storeVisits.reduce((sum, visit) => sum + visit.storeVisits, 0),
      totalSales: dailySales.length,
      totalRevenue: dailySales.reduce((sum, sale) => sum + sale.y, 0),
      totalCustomers: pieData.reduce((sum, p) => sum + p.value, 0),
      topCountry: countrySales[0]?.country || 'N/A'
    };
  }
}
