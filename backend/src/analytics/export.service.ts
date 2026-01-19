/**
 * Export Service
 *
 * Provides CSV and PDF export functionality for analytics data.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService, DateRange } from './analytics.service';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Generate CSV export of analytics data
   */
  async generateCsv(companyId: string, dateRange: DateRange): Promise<string> {
    try {
      // Fetch all analytics data
      const [salesMetrics, countrySales, topProducts, timeSeries] = await Promise.all([
        this.analyticsService.getSalesMetricsData(companyId, dateRange),
        this.analyticsService.getCountrySalesData(companyId, dateRange),
        this.analyticsService.getTopProductsData(companyId, dateRange),
        this.analyticsService.getTimeSeriesData(companyId, dateRange),
      ]);

      const lines: string[] = [];

      // Header
      lines.push('Breyus Analytics Report');
      lines.push(`Generated: ${new Date().toISOString()}`);
      lines.push(`Period: ${dateRange.startDate.toISOString().split('T')[0]} to ${dateRange.endDate.toISOString().split('T')[0]}`);
      lines.push(`Currency: ${salesMetrics.currency}`);
      lines.push('');

      // Summary Metrics Section
      lines.push('=== SUMMARY METRICS ===');
      lines.push('Metric,Value,Change vs Previous Period');
      lines.push(`Total Sales,${salesMetrics.totalSales},${salesMetrics.comparison.salesChange}%`);
      lines.push(`Total Volume,${salesMetrics.totalVolume},${salesMetrics.comparison.volumeChange}%`);
      lines.push(`Total Revenue,${salesMetrics.totalRevenue},${salesMetrics.comparison.revenueChange}%`);
      lines.push(`Average Order Value,${salesMetrics.averageOrderValue},${salesMetrics.comparison.averageOrderChange}%`);
      lines.push(`Total Customers,${salesMetrics.totalCustomers},${salesMetrics.comparison.customersChange}%`);
      lines.push(`New Customers,${salesMetrics.newCustomers},-`);
      lines.push(`Returning Customers,${salesMetrics.returningCustomers},-`);
      lines.push('');

      // Top Products Section
      lines.push('=== TOP PRODUCTS ===');
      lines.push('Product Name,Trade Count,Total Value');
      for (const product of topProducts) {
        lines.push(`"${product.productName}",${product.tradeCount},${product.totalValue}`);
      }
      lines.push('');

      // Sales by Country Section
      lines.push('=== SALES BY COUNTRY ===');
      lines.push('Country,Sales Count,Value,Percentage');
      for (const country of countrySales) {
        lines.push(`"${country.country}",${country.sales},"${country.value}",${country.percentage}`);
      }
      lines.push('');

      // Time Series Section
      lines.push('=== TIME SERIES DATA ===');
      lines.push('Date,Revenue,Volume');
      for (const point of timeSeries) {
        lines.push(`${point.date},${point.revenue},${point.volume}`);
      }

      return lines.join('\n');
    } catch (error) {
      this.logger.error('Error generating CSV:', error);
      throw error;
    }
  }

  /**
   * Generate PDF export of analytics data
   * Returns HTML that can be converted to PDF on the client side
   */
  async generatePdfHtml(companyId: string, dateRange: DateRange): Promise<string> {
    try {
      // Fetch all analytics data
      const [salesMetrics, countrySales, topProducts, timeSeries] = await Promise.all([
        this.analyticsService.getSalesMetricsData(companyId, dateRange),
        this.analyticsService.getCountrySalesData(companyId, dateRange),
        this.analyticsService.getTopProductsData(companyId, dateRange),
        this.analyticsService.getTimeSeriesData(companyId, dateRange),
      ]);

      const currencySymbol = salesMetrics.currency === 'INR' ? '₹' :
                             salesMetrics.currency === 'EUR' ? '€' : '$';

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Breyus Analytics Report</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #4F46E5;
    }
    .header h1 {
      color: #4F46E5;
      margin-bottom: 10px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #4F46E5;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: #F9FAFB;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #111;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .metric-change {
      font-size: 11px;
      margin-top: 5px;
    }
    .metric-change.positive { color: #10B981; }
    .metric-change.negative { color: #EF4444; }
    .metric-change.neutral { color: #6B7280; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #E5E7EB;
    }
    th {
      background: #F3F4F6;
      font-weight: 600;
      color: #374151;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #9CA3AF;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Breyus Analytics Report</h1>
    <div class="subtitle">
      Period: ${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}<br>
      Generated: ${new Date().toLocaleString()}<br>
      Currency: ${salesMetrics.currency}
    </div>
  </div>

  <div class="section">
    <h2>Summary Metrics</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">${salesMetrics.totalSales}</div>
        <div class="metric-label">Total Sales</div>
        <div class="metric-change ${salesMetrics.comparison.salesChange >= 0 ? 'positive' : 'negative'}">
          ${salesMetrics.comparison.salesChange >= 0 ? '+' : ''}${salesMetrics.comparison.salesChange}%
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${currencySymbol}${salesMetrics.totalRevenue.toLocaleString()}</div>
        <div class="metric-label">Total Revenue</div>
        <div class="metric-change ${salesMetrics.comparison.revenueChange >= 0 ? 'positive' : 'negative'}">
          ${salesMetrics.comparison.revenueChange >= 0 ? '+' : ''}${salesMetrics.comparison.revenueChange}%
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${currencySymbol}${salesMetrics.averageOrderValue.toLocaleString()}</div>
        <div class="metric-label">Avg Order Value</div>
        <div class="metric-change ${salesMetrics.comparison.averageOrderChange >= 0 ? 'positive' : 'negative'}">
          ${salesMetrics.comparison.averageOrderChange >= 0 ? '+' : ''}${salesMetrics.comparison.averageOrderChange}%
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${salesMetrics.totalCustomers}</div>
        <div class="metric-label">Total Customers</div>
        <div class="metric-change ${salesMetrics.comparison.customersChange >= 0 ? 'positive' : 'negative'}">
          ${salesMetrics.comparison.customersChange >= 0 ? '+' : ''}${salesMetrics.comparison.customersChange}%
        </div>
      </div>
    </div>
    <div class="metrics-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="metric-card">
        <div class="metric-value">${salesMetrics.totalVolume.toLocaleString()}</div>
        <div class="metric-label">Total Volume</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${salesMetrics.newCustomers}</div>
        <div class="metric-label">New Customers</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${salesMetrics.returningCustomers}</div>
        <div class="metric-label">Returning Customers</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Top Products</h2>
    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th>Trade Count</th>
          <th>Total Value</th>
        </tr>
      </thead>
      <tbody>
        ${topProducts.map(p => `
          <tr>
            <td>${p.productName}</td>
            <td>${p.tradeCount}</td>
            <td>${currencySymbol}${p.totalValue.toLocaleString()}</td>
          </tr>
        `).join('')}
        ${topProducts.length === 0 ? '<tr><td colspan="3" style="text-align: center; color: #9CA3AF;">No data available</td></tr>' : ''}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Sales by Country</h2>
    <table>
      <thead>
        <tr>
          <th>Country</th>
          <th>Sales Count</th>
          <th>Value</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${countrySales.map(c => `
          <tr>
            <td>${c.country}</td>
            <td>${c.sales}</td>
            <td>${c.value}</td>
            <td>${c.percentage}</td>
          </tr>
        `).join('')}
        ${countrySales.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #9CA3AF;">No data available</td></tr>' : ''}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Revenue & Volume Trend</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Revenue</th>
          <th>Volume</th>
        </tr>
      </thead>
      <tbody>
        ${timeSeries.map(t => `
          <tr>
            <td>${t.date}</td>
            <td>${currencySymbol}${t.revenue.toLocaleString()}</td>
            <td>${t.volume.toLocaleString()}</td>
          </tr>
        `).join('')}
        ${timeSeries.length === 0 ? '<tr><td colspan="3" style="text-align: center; color: #9CA3AF;">No data available</td></tr>' : ''}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Generated by Breyus Analytics</p>
    <p>This report contains confidential business information.</p>
  </div>
</body>
</html>
      `;

      return html;
    } catch (error) {
      this.logger.error('Error generating PDF HTML:', error);
      throw error;
    }
  }
}
