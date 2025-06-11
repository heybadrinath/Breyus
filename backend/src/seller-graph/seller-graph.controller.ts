import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { SellerGraphService } from './seller-graph.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('seller')
export class SellerGraphController {
  constructor(private readonly service: SellerGraphService) {}

  @UseGuards(JwtAuthGuard)
  @Get('bar-graph')
  getBarGraph(@Request() req) {
    return this.service.getBarGraph(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('scatter-graph')
  getScatterGraph(@Request() req) {
    return this.service.getScatterGraph(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pie-chart')
  getPieChart(@Request() req) {
    return this.service.getPieChart(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('country-sales')
  getCountrySales(@Request() req) {
    return this.service.getCountrySales(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('metrics')
  getMetrics(@Request() req) {
    return this.service.getMetrics(req.user.userId);
  }
}
