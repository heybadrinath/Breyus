import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminKycService } from './admin-kyc.service';
import { GetKycDocumentsQueryDto } from './dto/get-kyc-documents-query.dto';
import {
  ApproveDocumentDto,
  RejectDocumentDto,
} from './dto/review-document.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../activity/admin-action.decorator';

@Controller('admin/kyc')
@UseGuards(AdminAuthGuard)
export class AdminKycController {
  constructor(private readonly adminKycService: AdminKycService) {}

  @Get('documents')
  @AdminAction('kyc.list', 'kyc')
  async getDocuments(@Query() query: GetKycDocumentsQueryDto) {
    return this.adminKycService.getKycDocuments(query);
  }

  @Get('stats')
  @AdminAction('kyc.view_stats', 'kyc')
  async getStats() {
    return this.adminKycService.getKycStats();
  }

  @Get('companies/:companyId/documents/:docId')
  @AdminAction('kyc.view_document', 'kyc')
  async getDocument(
    @Param('companyId') companyId: string,
    @Param('docId') docId: string,
  ) {
    return this.adminKycService.getDocument(companyId, docId);
  }

  @Post('companies/:companyId/documents/:docId/approve')
  @AdminAction('kyc.document_approve', 'kyc')
  async approveDocument(
    @Param('companyId') companyId: string,
    @Param('docId') docId: string,
    @Body() dto: ApproveDocumentDto,
    @Req() req: any,
  ) {
    const adminId = req.admin._id.toString();
    const adminEmail = req.admin.email;
    return this.adminKycService.approveDocument(
      companyId,
      docId,
      dto.notes || '',
      adminId,
      adminEmail,
    );
  }

  @Post('companies/:companyId/documents/:docId/reject')
  @AdminAction('kyc.document_reject', 'kyc')
  async rejectDocument(
    @Param('companyId') companyId: string,
    @Param('docId') docId: string,
    @Body() dto: RejectDocumentDto,
    @Req() req: any,
  ) {
    const adminId = req.admin._id.toString();
    const adminEmail = req.admin.email;
    return this.adminKycService.rejectDocument(
      companyId,
      docId,
      dto.notes,
      adminId,
      adminEmail,
    );
  }
}
