import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AdminDisputesService } from './admin-disputes.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../common/decorators/admin-action.decorator';
import {
  GetDisputesQueryDto,
  AssignDisputeDto,
  SelfAssignDisputeDto,
  UpdateDisputeStatusDto,
  ResolveDisputeDto,
  AddDisputeMessageDto,
} from './dto';

@Controller('admin/disputes')
@UseGuards(AdminAuthGuard)
export class AdminDisputesController {
  constructor(private readonly adminDisputesService: AdminDisputesService) {}

  /**
   * Get paginated list of disputes with filters
   * GET /admin/disputes?page=1&limit=20&status=&priority=
   */
  @Get()
  @AdminAction({ action: 'dispute.list', category: 'disputes' })
  async getDisputes(@Query() query: GetDisputesQueryDto) {
    const result = await this.adminDisputesService.getDisputes(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Disputes retrieved successfully',
      data: result,
    };
  }

  /**
   * Get dispute statistics
   * GET /admin/disputes/stats
   */
  @Get('stats')
  @AdminAction({ action: 'dispute.stats', category: 'disputes' })
  async getDisputeStats() {
    const stats = await this.adminDisputesService.getDisputeStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Dispute statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get dispute by ID with full details
   * GET /admin/disputes/:id
   */
  @Get(':id')
  @AdminAction({ action: 'dispute.view', category: 'disputes' })
  async getDisputeById(@Param('id') id: string) {
    const dispute = await this.adminDisputesService.getDisputeById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Dispute retrieved successfully',
      data: dispute,
    };
  }

  /**
   * Get messages for a dispute
   * GET /admin/disputes/:id/messages
   */
  @Get(':id/messages')
  @AdminAction({ action: 'dispute.view_messages', category: 'disputes' })
  async getDisputeMessages(@Param('id') id: string) {
    const messages = await this.adminDisputesService.getMessages(id, true);
    return {
      statusCode: HttpStatus.OK,
      message: 'Messages retrieved successfully',
      data: messages,
    };
  }

  /**
   * Assign admin to dispute
   * POST /admin/disputes/:id/assign
   */
  @Post(':id/assign')
  @AdminAction({ action: 'dispute.assign', category: 'disputes' })
  async assignDispute(
    @Param('id') id: string,
    @Body() assignDto: AssignDisputeDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const dispute = await this.adminDisputesService.assignDispute(
      id,
      assignDto.adminId,
      admin._id.toString(),
      admin.email,
      assignDto.notes,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Dispute assigned successfully',
      data: dispute,
    };
  }

  /**
   * Self-assign dispute (admin assigns to themselves)
   * POST /admin/disputes/:id/self-assign
   */
  @Post(':id/self-assign')
  @AdminAction({ action: 'dispute.self_assign', category: 'disputes' })
  async selfAssignDispute(
    @Param('id') id: string,
    @Body() selfAssignDto: SelfAssignDisputeDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const dispute = await this.adminDisputesService.assignDispute(
      id,
      admin._id.toString(),
      admin._id.toString(),
      admin.email,
      selfAssignDto.notes,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Dispute assigned to you successfully',
      data: dispute,
    };
  }

  /**
   * Update dispute status
   * PATCH /admin/disputes/:id/status
   */
  @Patch(':id/status')
  @AdminAction({ action: 'dispute.update_status', category: 'disputes' })
  async updateDisputeStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateDisputeStatusDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const dispute = await this.adminDisputesService.updateDisputeStatus(
      id,
      statusDto,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Dispute status updated successfully',
      data: dispute,
    };
  }

  /**
   * Resolve dispute
   * POST /admin/disputes/:id/resolve
   */
  @Post(':id/resolve')
  @AdminAction({ action: 'dispute.resolve', category: 'disputes' })
  async resolveDispute(
    @Param('id') id: string,
    @Body() resolveDto: ResolveDisputeDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const dispute = await this.adminDisputesService.resolveDispute(
      id,
      resolveDto,
      admin._id.toString(),
      admin.email,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Dispute resolved successfully',
      data: dispute,
    };
  }

  /**
   * Add message to dispute
   * POST /admin/disputes/:id/messages
   */
  @Post(':id/messages')
  @AdminAction({ action: 'dispute.add_message', category: 'disputes' })
  async addMessage(
    @Param('id') id: string,
    @Body() messageDto: AddDisputeMessageDto,
    @Req() req: any,
  ) {
    const admin = req.admin;
    const message = await this.adminDisputesService.addMessage(
      id,
      messageDto,
      admin._id.toString(),
      admin.email,
      'admin',
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Message added successfully',
      data: message,
    };
  }
}
