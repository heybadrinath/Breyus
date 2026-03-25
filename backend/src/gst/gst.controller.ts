import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GstService } from './gst.service';
import { VerifyGSTDto } from './dto/verify-gst.dto';

/**
 * Optional standalone GST verification controller
 * Can be used for testing or standalone verification outside onboarding
 */
@Controller('gst')
export class GstController {
  constructor(private readonly gstService: GstService) {}

  /**
   * Verify a GST number
   * POST /gst/verify
   */
  @Post('verify')
  async verifyGST(@Body() verifyGstDto: VerifyGSTDto) {
    const { gstin, companyName } = verifyGstDto;

    // Step 1: Validate format
    const formatResult = this.gstService.validateGSTFormat(gstin);
    if (!formatResult.valid) {
      throw new HttpException(
        `Invalid GST format: ${formatResult.error}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Step 2: Verify with Cashfree API
      const verification = await this.gstService.verifyGST(gstin);

      if (verification.status !== 'VALID') {
        throw new HttpException(
          'GST number not found in government records',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (verification.statusOfGstin !== 'Active') {
        throw new HttpException(
          `GST registration is ${verification.statusOfGstin}. Only active GST numbers are accepted.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Step 3: Verify company name matches
      const nameMatches = this.gstService.matchCompanyName(
        companyName,
        verification.legalName,
        verification.tradeName,
      );

      return {
        statusCode: 200,
        message: 'GST verified successfully',
        data: {
          verified: true,
          nameMatches,
          gstin: verification.gstin,
          legalName: verification.legalName,
          tradeName: verification.tradeName,
          status: verification.statusOfGstin,
          registrationDate: verification.registrationDate,
          stateJurisdiction: verification.stateJurisdiction,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      // API failure
      throw new HttpException(
        'GST verification service temporarily unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Validate GST format only (without API call)
   * POST /gst/validate-format
   */
  @Post('validate-format')
  validateFormat(@Body('gstin') gstin: string) {
    const result = this.gstService.validateGSTFormat(gstin);

    if (!result.valid) {
      throw new HttpException(
        `Invalid GST format: ${result.error}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      statusCode: 200,
      message: 'GST format is valid',
      data: { valid: true },
    };
  }
}
