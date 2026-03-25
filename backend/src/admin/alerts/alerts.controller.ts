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
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../common/decorators/admin-action.decorator';
import {
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
  GetAlertRulesQueryDto,
  GetAlertHistoryQueryDto,
} from './dto';

@Controller('admin/alerts')
@UseGuards(AdminAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  // ============================================================================
  // RULES
  // ============================================================================

  /**
   * Get all alert rules
   * GET /admin/alerts/rules?eventType=&isEnabled=
   */
  @Get('rules')
  async getRules(@Query() query: GetAlertRulesQueryDto) {
    const rules = await this.alertsService.getRules(
      query.eventType,
      query.isEnabled,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Alert rules retrieved successfully',
      data: rules,
    };
  }

  /**
   * Create a new alert rule
   * POST /admin/alerts/rules
   */
  @Post('rules')
  @AdminAction({ action: 'alert.create', category: 'system' })
  async createRule(@Body() dto: CreateAlertRuleDto, @Req() req: any) {
    const admin = req.admin;
    const rule = await this.alertsService.createRule(dto, admin._id.toString());
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Alert rule created successfully',
      data: rule,
    };
  }

  /**
   * Get alert rule by ID
   * GET /admin/alerts/rules/:id
   */
  @Get('rules/:id')
  async getRuleById(@Param('id') id: string) {
    const rule = await this.alertsService.getRuleById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Alert rule retrieved successfully',
      data: rule,
    };
  }

  /**
   * Update alert rule
   * PUT /admin/alerts/rules/:id
   */
  @Put('rules/:id')
  @AdminAction({ action: 'alert.update', category: 'system' })
  async updateRule(@Param('id') id: string, @Body() dto: UpdateAlertRuleDto) {
    const rule = await this.alertsService.updateRule(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Alert rule updated successfully',
      data: rule,
    };
  }

  /**
   * Delete alert rule
   * DELETE /admin/alerts/rules/:id
   */
  @Delete('rules/:id')
  @AdminAction({ action: 'alert.delete', category: 'system' })
  async deleteRule(@Param('id') id: string) {
    await this.alertsService.deleteRule(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Alert rule deleted successfully',
    };
  }

  /**
   * Toggle alert rule enabled/disabled
   * PUT /admin/alerts/rules/:id/toggle
   */
  @Put('rules/:id/toggle')
  @AdminAction({ action: 'alert.toggle', category: 'system' })
  async toggleRule(@Param('id') id: string) {
    const rule = await this.alertsService.toggleRule(id);
    return {
      statusCode: HttpStatus.OK,
      message: `Alert rule ${rule.isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: rule,
    };
  }

  // ============================================================================
  // HISTORY
  // ============================================================================

  /**
   * Get alert history with filters and pagination
   * GET /admin/alerts/history?page=1&limit=20&ruleId=&eventType=&emailStatus=&startDate=&endDate=
   */
  @Get('history')
  async getHistory(@Query() query: GetAlertHistoryQueryDto) {
    const result = await this.alertsService.getHistory(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Alert history retrieved successfully',
      data: result,
    };
  }

  // ============================================================================
  // TEST
  // ============================================================================

  /**
   * Send test alert for a rule
   * POST /admin/alerts/test/:ruleId
   */
  @Post('test/:ruleId')
  @AdminAction({ action: 'alert.test', category: 'system' })
  async sendTestAlert(@Param('ruleId') ruleId: string) {
    await this.alertsService.sendTestAlert(ruleId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Test alert sent successfully',
    };
  }
}
