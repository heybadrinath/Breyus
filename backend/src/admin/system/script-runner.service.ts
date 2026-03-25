import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Types } from 'mongoose';
import { ActivityLogService } from '../activity/activity-log.service';

const execAsync = promisify(exec);

export interface ScriptResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
  timestamp: Date;
}

export type BackupTarget = 'all' | 'mongo' | 'postgres';

@Injectable()
export class ScriptRunnerService {
  private readonly logger = new Logger(ScriptRunnerService.name);
  private readonly scriptsPath: string;

  constructor(
    private configService: ConfigService,
    private activityLogService: ActivityLogService,
  ) {
    this.scriptsPath =
      this.configService.get<string>('SCRIPTS_PATH') || '/opt/breyus/scripts';
  }

  async createBackup(
    adminId: Types.ObjectId,
    adminEmail: string,
    target: BackupTarget = 'all',
  ): Promise<ScriptResult> {
    const start = Date.now();
    const timestamp = new Date();

    try {
      this.logger.log(
        `Admin ${adminEmail} initiated backup (target: ${target})`,
      );

      // Build backup command with target option
      let backupArgs = '--json';
      if (target === 'mongo') {
        backupArgs += ' --mongo-only';
      } else if (target === 'postgres') {
        backupArgs += ' --postgres-only';
      } else {
        backupArgs += ' --all';
      }

      const { stdout, stderr } = await execAsync(
        `${this.scriptsPath}/backup.sh ${backupArgs} 2>&1`,
        { timeout: 300000 }, // 5 minute timeout
      );

      // Try to parse JSON output from script
      let parsedOutput: any = null;
      try {
        // Find JSON in output (script may output logs before JSON)
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedOutput = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // JSON parsing failed, use raw output
      }

      const result: ScriptResult = {
        success: parsedOutput?.status === 'success' || !stderr,
        output: stdout || stderr || 'Backup completed successfully',
        duration: Date.now() - start,
        timestamp,
      };

      await this.activityLogService.log({
        adminId,
        adminEmail,
        action: 'CREATE_BACKUP',
        actionCategory: 'SYSTEM',
        description: `Created ${target} backup`,
        newValue: {
          target,
          duration: result.duration,
          output: result.output.substring(0, 500),
          backups: parsedOutput?.backups,
        },
      });

      this.logger.log(`Backup completed in ${result.duration}ms`);
      return result;
    } catch (error) {
      const result: ScriptResult = {
        success: false,
        output: '',
        error: error.message,
        duration: Date.now() - start,
        timestamp,
      };

      this.logger.error(`Backup failed: ${error.message}`);

      await this.activityLogService.log({
        adminId,
        adminEmail,
        action: 'CREATE_BACKUP',
        actionCategory: 'SYSTEM',
        description: `Backup failed (target: ${target})`,
        newValue: { target, error: error.message, duration: result.duration },
      });

      return result;
    }
  }

  async rotateLogs(
    adminId: Types.ObjectId,
    adminEmail: string,
  ): Promise<ScriptResult> {
    const start = Date.now();
    const timestamp = new Date();

    try {
      this.logger.log(`Admin ${adminEmail} initiated log rotation`);

      const { stdout, stderr } = await execAsync(
        `${this.scriptsPath}/rotate-logs.sh --json 2>&1`,
        { timeout: 120000 }, // 2 minute timeout (log archiving can take time)
      );

      // Try to parse JSON output from script
      let parsedOutput: any = null;
      try {
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedOutput = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // JSON parsing failed, use raw output
      }

      const result: ScriptResult = {
        success:
          parsedOutput?.status === 'success' ||
          parsedOutput?.status === 'partial' ||
          !stderr,
        output: stdout || stderr || 'Log rotation completed successfully',
        duration: Date.now() - start,
        timestamp,
      };

      await this.activityLogService.log({
        adminId,
        adminEmail,
        action: 'ROTATE_LOGS',
        actionCategory: 'SYSTEM',
        description: 'Rotated system logs',
        newValue: {
          duration: result.duration,
          summary: parsedOutput?.summary,
        },
      });

      this.logger.log(`Log rotation completed in ${result.duration}ms`);
      return result;
    } catch (error) {
      const result: ScriptResult = {
        success: false,
        output: '',
        error: error.message,
        duration: Date.now() - start,
        timestamp,
      };

      this.logger.error(`Log rotation failed: ${error.message}`);

      await this.activityLogService.log({
        adminId,
        adminEmail,
        action: 'ROTATE_LOGS',
        actionCategory: 'SYSTEM',
        description: 'Log rotation failed',
        newValue: { error: error.message },
      });

      return result;
    }
  }

  async triggerHealthCheck(
    adminId: Types.ObjectId,
    adminEmail: string,
  ): Promise<ScriptResult> {
    const start = Date.now();
    const timestamp = new Date();

    this.logger.log(`Admin ${adminEmail} triggered manual health check`);

    await this.activityLogService.log({
      adminId,
      adminEmail,
      action: 'MANUAL_HEALTH_CHECK',
      actionCategory: 'SYSTEM',
      description: 'Triggered manual health check',
    });

    return {
      success: true,
      output: 'Health check triggered successfully',
      duration: Date.now() - start,
      timestamp,
    };
  }

  async runCustomScript(
    scriptName: string,
    adminId: Types.ObjectId,
    adminEmail: string,
    args: string[] = [],
  ): Promise<ScriptResult> {
    const start = Date.now();
    const timestamp = new Date();

    // Whitelist of allowed scripts for security
    const allowedScripts = [
      'backup.sh',
      'rotate-logs.sh',
      'health-check.sh',
      'renew-certs.sh',
      'container-status.sh',
      'disk-report.sh',
    ];

    if (!allowedScripts.includes(scriptName)) {
      return {
        success: false,
        output: '',
        error: `Script '${scriptName}' is not in the allowed list`,
        duration: 0,
        timestamp,
      };
    }

    try {
      this.logger.log(`Admin ${adminEmail} running script: ${scriptName}`);

      const safeArgs = args
        .map((arg) => arg.replace(/[;&|`$()]/g, ''))
        .join(' ');
      const { stdout, stderr } = await execAsync(
        `${this.scriptsPath}/${scriptName} ${safeArgs} 2>&1`,
        { timeout: 300000 },
      );

      const result: ScriptResult = {
        success: true,
        output: stdout || stderr || 'Script completed successfully',
        duration: Date.now() - start,
        timestamp,
      };

      await this.activityLogService.log({
        adminId,
        adminEmail,
        action: 'RUN_SCRIPT',
        actionCategory: 'SYSTEM',
        description: `Ran script: ${scriptName}`,
        newValue: { scriptName, args: safeArgs, duration: result.duration },
      });

      return result;
    } catch (error) {
      const result: ScriptResult = {
        success: false,
        output: '',
        error: error.message,
        duration: Date.now() - start,
        timestamp,
      };

      this.logger.error(`Script ${scriptName} failed: ${error.message}`);

      await this.activityLogService.log({
        adminId,
        adminEmail,
        action: 'RUN_SCRIPT',
        actionCategory: 'SYSTEM',
        description: `Script failed: ${scriptName}`,
        newValue: { scriptName, error: error.message },
      });

      return result;
    }
  }
}
