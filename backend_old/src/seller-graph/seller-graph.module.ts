import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerGraphController } from './seller-graph.controller';
import { SellerGraphService } from './seller-graph.service';
import { BarGraph } from './entities/bar-graph.entity';
import { ScatterGraph } from './entities/scatter-graph.entity';
import { PieChart } from './entities/pie-chart.entity';
import { CountrySales } from './entities/country-sales.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BarGraph,
      ScatterGraph,
      PieChart,
      CountrySales
    ])
  ],
  controllers: [SellerGraphController],
  providers: [SellerGraphService],
})
export class SellerGraphModule {}
