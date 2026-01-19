/**
 * Export Service
 *
 * Generates CSV and PDF reports from analytics data.
 * - CSV: Uses json2csv library for data export
 * - PDF: Uses pdfkit for formatted PDF reports
 */

import { Injectable, Logger } from '@nestjs/common';
import { Parser } from 'json2csv';
import * as PDFDocument from 'pdfkit';
import { AdminAnalyticsService, PlatformOverview, TradeAnalytics, UserAnalytics, FinancialAnalytics } from '../admin-analytics.service';

export interface ExportOptions {
  type: 'csv' | 'pdf';
  section: 'all' | 'overview' | 'trades' | 'users' | 'financial';
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  async generateExport(options: ExportOptions): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const { type, section, startDate, endDate } = options;
    const dateStr = new Date().toISOString().split('T')[0];

    if (type === 'csv') {
      const csvData = await this.generateCsvData(section, startDate, endDate);
      return {
        buffer: Buffer.from(csvData, 'utf-8'),
        filename: `breyus-analytics-${section}-${dateStr}.csv`,
        mimeType: 'text/csv',
      };
    } else {
      const pdfBuffer = await this.generatePdfReport(section, startDate, endDate);
      return {
        buffer: pdfBuffer,
        filename: `breyus-analytics-${section}-${dateStr}.pdf`,
        mimeType: 'application/pdf',
      };
    }
  }

  // ========================================================================
  // CSV GENERATION
  // ========================================================================

  private async generateCsvData(
    section: string,
    startDate?: string,
    endDate?: string,
  ): Promise<string> {
    const csvSections: string[] = [];
    const dateRangeHeader = `# Date Range: ${startDate || 'Last 30 days'} to ${endDate || 'Today'}\n# Generated: ${new Date().toISOString()}\n\n`;

    if (section === 'all' || section === 'overview') {
      const overview = await this.analyticsService.getOverviewMetrics(startDate, endDate);
      csvSections.push(this.overviewToCsv(overview));
    }

    if (section === 'all' || section === 'trades') {
      const trades = await this.analyticsService.getTradeAnalytics(startDate, endDate);
      csvSections.push(this.tradeAnalyticsToCsv(trades));
    }

    if (section === 'all' || section === 'users') {
      const users = await this.analyticsService.getUserAnalytics(startDate, endDate);
      csvSections.push(this.userAnalyticsToCsv(users));
    }

    if (section === 'all' || section === 'financial') {
      const financial = await this.analyticsService.getFinancialAnalytics(startDate, endDate);
      csvSections.push(this.financialAnalyticsToCsv(financial));
    }

    return dateRangeHeader + csvSections.join('\n\n');
  }

  private overviewToCsv(data: PlatformOverview): string {
    const header = '# PLATFORM OVERVIEW\n';
    const rows = [
      { Metric: 'Total Users', Value: data.users.total, Change: `${data.users.change}%` },
      { Metric: 'Active Users', Value: data.users.active, Change: '-' },
      { Metric: 'New Users', Value: data.users.new, Change: `${data.users.change}%` },
      { Metric: 'Total Trades', Value: data.trades.total, Change: `${data.trades.change}%` },
      { Metric: 'Active Trades', Value: data.trades.active, Change: '-' },
      { Metric: 'Completed Trades', Value: data.trades.completed, Change: '-' },
      { Metric: 'Total Products', Value: data.products.total, Change: `${data.products.change}%` },
      { Metric: 'Total Revenue', Value: `$${data.revenue.total.toLocaleString()}`, Change: `${data.revenue.change}%` },
    ];

    const parser = new Parser({ fields: ['Metric', 'Value', 'Change'] });
    return header + parser.parse(rows);
  }

  private tradeAnalyticsToCsv(data: TradeAnalytics): string {
    const sections: string[] = [];

    // Time Series
    if (data.timeSeries.length > 0) {
      sections.push('# TRADE TIME SERIES');
      const parser = new Parser({ fields: ['date', 'count', 'value'] });
      sections.push(parser.parse(data.timeSeries));
    }

    // Funnel
    if (data.funnel.length > 0) {
      sections.push('# TRADE FUNNEL');
      const parser = new Parser({ fields: ['phase', 'count'] });
      sections.push(parser.parse(data.funnel));
    }

    // Phase Timings
    if (data.phaseTimings.length > 0) {
      sections.push('# AVERAGE PHASE DURATION (DAYS)');
      const parser = new Parser({ fields: ['phase', 'avgDays'] });
      sections.push(parser.parse(data.phaseTimings));
    }

    // Rejection Reasons
    if (data.rejectionReasons.length > 0) {
      sections.push('# REJECTION REASONS');
      const parser = new Parser({ fields: ['reason', 'count'] });
      sections.push(parser.parse(data.rejectionReasons));
    }

    sections.push(`# COMPLETION RATE: ${data.completionRate}%`);

    return sections.join('\n\n');
  }

  private userAnalyticsToCsv(data: UserAnalytics): string {
    const sections: string[] = [];

    // Registrations
    if (data.registrations.length > 0) {
      sections.push('# USER REGISTRATIONS');
      const parser = new Parser({ fields: ['date', 'count'] });
      sections.push(parser.parse(data.registrations));
    }

    // Role Distribution
    if (data.roleDistribution.length > 0) {
      sections.push('# ROLE DISTRIBUTION');
      const parser = new Parser({ fields: ['role', 'count'] });
      sections.push(parser.parse(data.roleDistribution));
    }

    // Geographic
    if (data.geographic.length > 0) {
      sections.push('# GEOGRAPHIC DISTRIBUTION');
      const parser = new Parser({ fields: ['country', 'count'] });
      sections.push(parser.parse(data.geographic));
    }

    // Onboarding Funnel
    if (data.onboardingFunnel.length > 0) {
      sections.push('# ONBOARDING FUNNEL');
      const parser = new Parser({ fields: ['step', 'count', 'dropoff'] });
      sections.push(parser.parse(data.onboardingFunnel));
    }

    sections.push(`# ACTIVATION RATE: ${data.activationRate}%`);

    return sections.join('\n\n');
  }

  private financialAnalyticsToCsv(data: FinancialAnalytics): string {
    const sections: string[] = [];

    // Value Time Series
    if (data.valueTimeSeries.length > 0) {
      sections.push('# REVENUE TIME SERIES');
      const parser = new Parser({ fields: ['date', 'value'] });
      sections.push(parser.parse(data.valueTimeSeries));
    }

    // By Category
    if (data.byCategory.length > 0) {
      sections.push('# VALUE BY CATEGORY');
      const parser = new Parser({ fields: ['category', 'value'] });
      sections.push(parser.parse(data.byCategory));
    }

    // By Incoterm
    if (data.byIncoterm.length > 0) {
      sections.push('# VALUE BY INCOTERM');
      const parser = new Parser({ fields: ['incoterm', 'value', 'count'] });
      sections.push(parser.parse(data.byIncoterm));
    }

    sections.push(`# AVERAGE DEAL SIZE: $${data.avgDealSize.toLocaleString()} (${data.avgDealSizeChange >= 0 ? '+' : ''}${data.avgDealSizeChange}%)`);

    return sections.join('\n\n');
  }

  // ========================================================================
  // PDF GENERATION
  // ========================================================================

  private async generatePdfReport(
    section: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: 'Breyus Analytics Report',
            Author: 'Breyus Admin Portal',
            Subject: 'Platform Analytics',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.addPdfHeader(doc, startDate, endDate);

        // Sections
        if (section === 'all' || section === 'overview') {
          const overview = await this.analyticsService.getOverviewMetrics(startDate, endDate);
          this.addOverviewSection(doc, overview);
        }

        if (section === 'all' || section === 'trades') {
          const trades = await this.analyticsService.getTradeAnalytics(startDate, endDate);
          this.addTradesSection(doc, trades);
        }

        if (section === 'all' || section === 'users') {
          const users = await this.analyticsService.getUserAnalytics(startDate, endDate);
          this.addUsersSection(doc, users);
        }

        if (section === 'all' || section === 'financial') {
          const financial = await this.analyticsService.getFinancialAnalytics(startDate, endDate);
          this.addFinancialSection(doc, financial);
        }

        // Footer
        this.addPdfFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addPdfHeader(doc: PDFKit.PDFDocument, startDate?: string, endDate?: string): void {
    // Title
    doc.fontSize(24).fillColor('#1a1a2e').text('Breyus Analytics Report', { align: 'center' });
    doc.moveDown(0.5);

    // Date range
    const dateRange = startDate && endDate
      ? `${startDate} to ${endDate}`
      : 'Last 30 Days';
    doc.fontSize(12).fillColor('#666666').text(`Period: ${dateRange}`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });

    // Line separator
    doc.moveDown(1);
    doc.strokeColor('#e0e0e0').lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();
    doc.moveDown(1);
  }

  private addOverviewSection(doc: PDFKit.PDFDocument, data: PlatformOverview): void {
    this.addSectionTitle(doc, 'Platform Overview');

    const metrics = [
      ['Metric', 'Value', 'Change'],
      ['Total Users', data.users.total.toString(), `${data.users.change}%`],
      ['Active Users', data.users.active.toString(), '-'],
      ['New Users (Period)', data.users.new.toString(), '-'],
      ['Total Trades', data.trades.total.toString(), `${data.trades.change}%`],
      ['Active Trades', data.trades.active.toString(), '-'],
      ['Completed Trades', data.trades.completed.toString(), '-'],
      ['Total Products', data.products.total.toString(), `${data.products.change}%`],
      ['Total Revenue', `$${data.revenue.total.toLocaleString()}`, `${data.revenue.change}%`],
    ];

    this.addTable(doc, metrics);
    doc.moveDown(1);
  }

  private addTradesSection(doc: PDFKit.PDFDocument, data: TradeAnalytics): void {
    this.checkPageBreak(doc);
    this.addSectionTitle(doc, 'Trade Analytics');

    // Completion rate highlight
    doc.fontSize(11).fillColor('#333333')
      .text(`Completion Rate: ${data.completionRate}%`, { continued: false });
    doc.moveDown(0.5);

    // Funnel table
    if (data.funnel.length > 0) {
      doc.fontSize(10).fillColor('#666666').text('Trade Funnel:');
      const funnelTable = [['Phase', 'Count']];
      for (const item of data.funnel) {
        funnelTable.push([item.phase, item.count.toString()]);
      }
      this.addTable(doc, funnelTable);
      doc.moveDown(0.5);
    }

    // Phase timings
    if (data.phaseTimings.length > 0) {
      doc.fontSize(10).fillColor('#666666').text('Average Phase Duration:');
      const timingTable = [['Phase Transition', 'Avg Days']];
      for (const item of data.phaseTimings) {
        timingTable.push([item.phase, item.avgDays.toString()]);
      }
      this.addTable(doc, timingTable);
      doc.moveDown(0.5);
    }

    // Rejection reasons
    if (data.rejectionReasons.length > 0) {
      doc.fontSize(10).fillColor('#666666').text('Top Rejection Reasons:');
      const reasonsTable = [['Reason', 'Count']];
      for (const item of data.rejectionReasons.slice(0, 5)) {
        reasonsTable.push([item.reason.substring(0, 40), item.count.toString()]);
      }
      this.addTable(doc, reasonsTable);
    }

    doc.moveDown(1);
  }

  private addUsersSection(doc: PDFKit.PDFDocument, data: UserAnalytics): void {
    this.checkPageBreak(doc);
    this.addSectionTitle(doc, 'User Analytics');

    // Activation rate highlight
    doc.fontSize(11).fillColor('#333333')
      .text(`Activation Rate: ${data.activationRate}%`, { continued: false });
    doc.moveDown(0.5);

    // Role distribution
    if (data.roleDistribution.length > 0) {
      doc.fontSize(10).fillColor('#666666').text('Role Distribution:');
      const roleTable = [['Role', 'Count']];
      for (const item of data.roleDistribution) {
        roleTable.push([item.role, item.count.toString()]);
      }
      this.addTable(doc, roleTable);
      doc.moveDown(0.5);
    }

    // Geographic
    if (data.geographic.length > 0) {
      doc.fontSize(10).fillColor('#666666').text('Top Countries:');
      const geoTable = [['Country', 'Count']];
      for (const item of data.geographic.slice(0, 10)) {
        geoTable.push([item.country, item.count.toString()]);
      }
      this.addTable(doc, geoTable);
      doc.moveDown(0.5);
    }

    // Onboarding funnel
    if (data.onboardingFunnel.length > 0) {
      doc.fontSize(10).fillColor('#666666').text('Onboarding Funnel:');
      const funnelTable = [['Step', 'Count', 'Dropoff']];
      for (const item of data.onboardingFunnel) {
        funnelTable.push([item.step, item.count.toString(), `${item.dropoff}%`]);
      }
      this.addTable(doc, funnelTable);
    }

    doc.moveDown(1);
  }

  private addFinancialSection(doc: PDFKit.PDFDocument, data: FinancialAnalytics): void {
    this.checkPageBreak(doc);
    this.addSectionTitle(doc, 'Financial Analytics');

    // Average deal size highlight
    const changeSign = data.avgDealSizeChange >= 0 ? '+' : '';
    doc.fontSize(11).fillColor('#333333')
      .text(`Average Deal Size: $${data.avgDealSize.toLocaleString()} (${changeSign}${data.avgDealSizeChange}%)`, { continued: false });
    doc.moveDown(0.5);

    // By category
    if (data.byCategory.length > 0) {
      doc.fontSize(10).fillColor('#666666').text('Value by Category:');
      const catTable = [['Category', 'Value']];
      for (const item of data.byCategory.slice(0, 8)) {
        catTable.push([item.category.substring(0, 30), `$${item.value.toLocaleString()}`]);
      }
      this.addTable(doc, catTable);
      doc.moveDown(0.5);
    }

    // By incoterm
    if (data.byIncoterm.length > 0) {
      doc.fontSize(10).fillColor('#666666').text('Value by Incoterm:');
      const incotermTable = [['Incoterm', 'Value', 'Count']];
      for (const item of data.byIncoterm) {
        incotermTable.push([item.incoterm, `$${item.value.toLocaleString()}`, item.count.toString()]);
      }
      this.addTable(doc, incotermTable);
    }

    doc.moveDown(1);
  }

  private addSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    doc.fontSize(14).fillColor('#1a1a2e').text(title);
    doc.moveDown(0.3);
    doc.strokeColor('#4a90d9').lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(150, doc.y)
      .stroke();
    doc.moveDown(0.5);
  }

  private addTable(doc: PDFKit.PDFDocument, rows: string[][]): void {
    const startX = 50;
    const colWidth = 150;
    const rowHeight = 18;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const isHeader = i === 0;
      const y = doc.y;

      // Background for header
      if (isHeader) {
        doc.fillColor('#f5f5f5')
          .rect(startX, y - 2, colWidth * row.length, rowHeight)
          .fill();
      }

      // Draw cells
      for (let j = 0; j < row.length; j++) {
        doc.fontSize(isHeader ? 9 : 9)
          .fillColor(isHeader ? '#333333' : '#555555')
          .text(row[j], startX + (j * colWidth), y, {
            width: colWidth - 10,
            align: j === 0 ? 'left' : 'right',
          });
      }

      doc.y = y + rowHeight;
    }

    doc.moveDown(0.3);
  }

  private checkPageBreak(doc: PDFKit.PDFDocument): void {
    if (doc.y > doc.page.height - 150) {
      doc.addPage();
    }
  }

  private addPdfFooter(doc: PDFKit.PDFDocument): void {
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#999999')
        .text(
          `Page ${i + 1} of ${totalPages} | Breyus Admin Portal`,
          50,
          doc.page.height - 30,
          { align: 'center', width: doc.page.width - 100 },
        );
    }
  }
}
