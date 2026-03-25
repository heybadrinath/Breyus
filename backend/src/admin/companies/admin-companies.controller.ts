import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminCompaniesService } from './admin-companies.service';
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { VerifyCompanyDto } from './dto/verify-company.dto';
import { ApproveGstDto } from './dto/approve-gst.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../activity/admin-action.decorator';

@Controller('admin/companies')
@UseGuards(AdminAuthGuard)
export class AdminCompaniesController {
  constructor(private readonly adminCompaniesService: AdminCompaniesService) {}

  @Get()
  @AdminAction('company.list', 'companies')
  async getCompanies(@Query() query: GetCompaniesQueryDto) {
    return this.adminCompaniesService.getCompanies(query);
  }

  @Get('stats')
  @AdminAction('company.page_stats', 'companies')
  async getPageStats() {
    const stats = await this.adminCompaniesService.getPageStats();
    return { data: stats };
  }

  @Get(':id')
  @AdminAction('company.view', 'companies')
  async getCompanyById(@Param('id') id: string) {
    return this.adminCompaniesService.getCompanyById(id);
  }

  @Get(':id/stats')
  @AdminAction('company.view_stats', 'companies')
  async getCompanyStats(@Param('id') id: string) {
    return this.adminCompaniesService.getCompanyStats(id);
  }

  @Patch(':id')
  @AdminAction('company.update', 'companies')
  async updateCompany(
    @Param('id') id: string,
    @Body() updateDto: UpdateCompanyDto,
    @Req() req: any,
  ) {
    const adminId = req.admin._id.toString();
    const adminEmail = req.admin.email;
    return this.adminCompaniesService.updateCompany(
      id,
      updateDto,
      adminId,
      adminEmail,
    );
  }

  @Delete(':id')
  @AdminAction('company.delete', 'companies')
  async deleteCompany(@Param('id') id: string, @Req() req: any) {
    const adminId = req.admin._id.toString();
    const adminEmail = req.admin.email;
    await this.adminCompaniesService.deleteCompany(id, adminId, adminEmail);
    return { message: 'Company deleted successfully' };
  }

  @Post(':id/verify')
  @AdminAction('company.verify', 'companies')
  async verifyCompany(
    @Param('id') id: string,
    @Body() dto: VerifyCompanyDto,
    @Req() req: any,
  ) {
    const adminId = req.admin._id.toString();
    const adminEmail = req.admin.email;
    return this.adminCompaniesService.verifyCompany(
      id,
      dto.notes || '',
      adminId,
      adminEmail,
    );
  }

  @Post(':id/unverify')
  @AdminAction('company.unverify', 'companies')
  async unverifyCompany(@Param('id') id: string, @Req() req: any) {
    const adminId = req.admin._id.toString();
    const adminEmail = req.admin.email;
    return this.adminCompaniesService.unverifyCompany(id, adminId, adminEmail);
  }

  @Post(':id/gst/approve')
  @AdminAction('company.gst_approve', 'companies')
  async approveGst(
    @Param('id') id: string,
    @Body() dto: ApproveGstDto,
    @Req() req: any,
  ) {
    const adminId = req.admin._id.toString();
    const adminEmail = req.admin.email;
    return this.adminCompaniesService.approveGst(
      id,
      dto.notes || '',
      adminId,
      adminEmail,
    );
  }

  @Post(':id/gst/clear-flag')
  @AdminAction('company.gst_clear_flag', 'companies')
  async clearGstFlag(@Param('id') id: string, @Req() req: any) {
    const adminId = req.admin._id.toString();
    const adminEmail = req.admin.email;
    return this.adminCompaniesService.clearGstPendingFlag(
      id,
      adminId,
      adminEmail,
    );
  }

  @Get('gst/pending-count')
  @AdminAction('company.gst_pending_count', 'companies')
  async getGstPendingCount() {
    const count = await this.adminCompaniesService.getGstPendingCount();
    return { data: { count } };
  }
}
