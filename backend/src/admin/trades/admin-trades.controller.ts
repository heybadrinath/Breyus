import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { AdminTradesService } from './admin-trades.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../common/decorators/admin-action.decorator';
import {
  GetTradesQueryDto,
  AddTradeNoteDto,
  VerifyDocumentDto,
  ForcePhaseChangeDto,
  SendReminderDto,
} from './dto';

@Controller('admin/trades')
@UseGuards(AdminAuthGuard)
export class AdminTradesController {
  constructor(private readonly adminTradesService: AdminTradesService) {}

  /**
   * Get paginated list of trades with filters
   * GET /admin/trades?page=1&limit=20&search=&negotiationStatus=&tradePhase=&isStalled=
   */
  @Get()
  @AdminAction({ action: 'trade.list', category: 'trades' })
  async getTrades(@Query() query: GetTradesQueryDto) {
    const result = await this.adminTradesService.getTrades(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Trades retrieved successfully',
      data: result,
    };
  }

  /**
   * Get trade statistics
   * GET /admin/trades/stats
   */
  @Get('stats')
  @AdminAction({ action: 'trade.stats', category: 'trades' })
  async getTradeStats() {
    const stats = await this.adminTradesService.getTradeStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Trade statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get stalled trades (trades stuck in a phase for more than X days)
   * GET /admin/trades/stalled?days=7
   */
  @Get('stalled')
  @AdminAction({ action: 'trade.stalled', category: 'trades' })
  async getStalledTrades(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    const trades = await this.adminTradesService.getStalledTrades(daysNum);
    return {
      statusCode: HttpStatus.OK,
      message: 'Stalled trades retrieved successfully',
      data: {
        trades,
        total: trades.length,
        threshold: daysNum,
      },
    };
  }

  /**
   * Get trade by ID with full details
   * GET /admin/trades/:id
   */
  @Get(':id')
  @AdminAction({ action: 'trade.view', category: 'trades' })
  async getTradeById(@Param('id') id: string) {
    const trade = await this.adminTradesService.getTradeById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Trade retrieved successfully',
      data: trade,
    };
  }

  /**
   * Get trade timeline (all events in chronological order)
   * GET /admin/trades/:id/timeline
   */
  @Get(':id/timeline')
  @AdminAction({ action: 'trade.timeline', category: 'trades' })
  async getTradeTimeline(@Param('id') id: string) {
    const timeline = await this.adminTradesService.getTradeTimeline(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Trade timeline retrieved successfully',
      data: timeline,
    };
  }

  /**
   * Get admin notes for a trade
   * GET /admin/trades/:id/notes
   */
  @Get(':id/notes')
  @AdminAction({ action: 'trade.view_notes', category: 'trades' })
  async getTradeNotes(@Param('id') id: string) {
    const notes = await this.adminTradesService.getTradeNotes(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Trade notes retrieved successfully',
      data: notes,
    };
  }

  /**
   * Add admin note to trade
   * POST /admin/trades/:id/notes
   */
  @Post(':id/notes')
  @AdminAction({ action: 'trade.add_note', category: 'trades' })
  async addTradeNote(
    @Param('id') id: string,
    @Body() noteDto: AddTradeNoteDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const note = await this.adminTradesService.addTradeNote(
      id,
      noteDto,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Note added successfully',
      data: note,
    };
  }

  /**
   * Delete admin note from trade
   * DELETE /admin/trades/:id/notes/:noteId
   */
  @Delete(':id/notes/:noteId')
  @AdminAction({ action: 'trade.delete_note', category: 'trades' })
  async deleteTradeNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Req() req: any,
  ) {
    const admin = req.admin;
    await this.adminTradesService.deleteTradeNote(
      id,
      noteId,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Note deleted successfully',
    };
  }

  // ========================
  // DOCUMENT VERIFICATION
  // ========================

  /**
   * Verify or reject a trade document
   * PUT /admin/trades/:id/verify-document
   */
  @Put(':id/verify-document')
  @AdminAction({ action: 'trade.verify_document', category: 'trades' })
  async verifyDocument(
    @Param('id') id: string,
    @Body() dto: VerifyDocumentDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const result = await this.adminTradesService.verifyDocument(
      id,
      dto,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: `Document ${dto.status}`,
      data: result,
    };
  }

  // ========================
  // FORCE PHASE CHANGE
  // ========================

  /**
   * Force change trade phase
   * PUT /admin/trades/:id/force-phase
   */
  @Put(':id/force-phase')
  @AdminAction({ action: 'trade.force_phase', category: 'trades' })
  async forcePhaseChange(
    @Param('id') id: string,
    @Body() dto: ForcePhaseChangeDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const result = await this.adminTradesService.forcePhaseChange(
      id,
      dto,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Trade phase changed',
      data: result,
    };
  }

  // ========================
  // DOCUMENT DOWNLOAD
  // ========================

  /**
   * Download a trade document
   * GET /admin/trades/:id/documents/:type/download
   */
  @Get(':id/documents/:type/download')
  @AdminAction({ action: 'trade.download_document', category: 'trades' })
  async downloadDocument(
    @Param('id') id: string,
    @Param('type') type: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const docInfo = await this.adminTradesService.getDocumentDownloadInfo(
      id,
      type,
    );

    // Construct the full file path
    // Files are stored in uploads directory relative to project root
    const filePath = join(process.cwd(), docInfo.filePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      throw new Error('File not found on server');
    }

    // Set response headers for download
    res.set({
      'Content-Type': docInfo.mimeType,
      'Content-Disposition': `attachment; filename="${docInfo.originalName}"`,
    });

    const file = createReadStream(filePath);
    return new StreamableFile(file);
  }

  // ========================
  // STALLED TRADE REMINDER
  // ========================

  /**
   * Send reminder email to buyer and/or seller for stalled trade
   * POST /admin/trades/:id/send-reminder
   */
  @Post(':id/send-reminder')
  @AdminAction({ action: 'trade.send_reminder', category: 'trades' })
  async sendStalledTradeReminder(
    @Param('id') id: string,
    @Body() dto: SendReminderDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const result = await this.adminTradesService.sendStalledTradeReminder(
      id,
      dto,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: result.success
        ? `Reminder sent to ${result.sentTo.join(', ')}`
        : 'No reminders sent',
      data: result,
    };
  }
}
