import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { TradeService } from './trade.service';
import { InvoiceService } from './invoice.service';
import { AuditService } from './audit.service';
import { AdminDisputesService } from '../admin/disputes/admin-disputes.service';
import { StorageService } from '../common/storage/storage.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import {
  UploadSCODto,
  UploadICPODto,
  UploadSPADto,
  UploadBoLDto,
  UploadPaymentProofDto,
  AdvancePhaseDto,
  UpdateDocumentStatusDto,
  SignDocumentDto,
  DocumentType,
} from './dto/upload-document.dto';
import { TradePaginationDto } from './dto/trade-pagination.dto';
import { CreateDisputeDto } from '../admin/disputes/dto/create-dispute.dto';
import { AddDisputeMessageDto } from '../admin/disputes/dto/add-dispute-message.dto';
import { FileUploadInterceptor } from '../products/file-upload.interceptor';
import { AuthGuard } from '../auth/auth.guard';

/**
 * Trade Controller
 * All routes are protected by AuthGuard which validates:
 * - Cookie-based JWT authentication
 * - User existence in database
 * - User is not suspended
 */
@Controller('trade')
@UseGuards(AuthGuard)
export class TradeController {
  private readonly logger = new Logger(TradeController.name);

  constructor(
    private readonly tradeService: TradeService,
    private readonly invoiceService: InvoiceService,
    private readonly auditService: AuditService,
    private readonly disputesService: AdminDisputesService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Issue #16 - Centralized error response handler with logging
   * Logs server errors (5xx) for debugging while preserving client-facing messages
   */
  private handleError(error: any, response: Response, context: string) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';

    // Log server errors for debugging (5xx)
    if (status >= 500) {
      console.error(`[TradeController] ${context}:`, {
        status,
        message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });
    }

    return response.status(status).json({
      statusCode: status,
      message,
    });
  }

  @Post('create')
  async createTrade(
    @Body() createTradeDto: CreateTradeDto,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.createTrade(
        createTradeDto,
        accountToken,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return this.handleError(error, response, 'createTrade');
    }
  }

  @Get('user-trades')
  async getUserTrades(@Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.getUserTrades(accountToken);
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get('seller-trades')
  async getSellerTrades(@Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.getSellerTrades(accountToken);
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get('user-trades/paginated')
  async getUserTradesPaginated(
    @Query() pagination: TradePaginationDto,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.getUserTradesPaginated(
        accountToken,
        pagination,
      );
      return response.status(200).json({
        statusCode: 200,
        message: 'Paginated trades retrieved successfully',
        data: result,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get('seller-trades/paginated')
  async getSellerTradesPaginated(
    @Query() pagination: TradePaginationDto,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.getSellerTradesPaginated(
        accountToken,
        pagination,
      );
      return response.status(200).json({
        statusCode: 200,
        message: 'Paginated trades retrieved successfully',
        data: result,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get('unread-counts')
  async getUnreadCounts(@Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.getUnreadCounts(accountToken);
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Put('mark-read/:tabType')
  async markAsRead(
    @Param('tabType') tabType: string,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      // Validate tabType
      const validTabTypes = ['pr', 'po', 'spa', 'ongoing', 'history'];
      if (!validTabTypes.includes(tabType)) {
        return response.status(400).json({
          statusCode: 400,
          message:
            'Invalid tab type. Must be one of: pr, po, spa, ongoing, history',
        });
      }

      const result = await this.tradeService.markTradesAsRead(
        accountToken,
        tabType as 'pr' | 'po' | 'spa' | 'ongoing' | 'history',
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get(':id')
  async getTradeById(@Param('id') id: string, @Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.getTradeById(id, accountToken);
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Post(':id/counter-offer')
  async submitCounterOffer(
    @Param('id') id: string,
    @Body()
    counterOfferData: {
      offeredPrice?: string;
      offeredIncoterms?: any;
      message?: string;
    },
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.submitCounterOffer(
        id,
        accountToken,
        counterOfferData,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Post(':id/buyer-respond')
  async buyerRespond(
    @Param('id') id: string,
    @Body()
    responseData: {
      offeredPrice?: string;
      offeredIncoterms?: any;
      message?: string;
    },
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.buyerRespond(
        id,
        accountToken,
        responseData,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Put(':id/accept')
  async acceptTrade(@Param('id') id: string, @Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.acceptTrade(id, accountToken);
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Put(':id/reject')
  async rejectTrade(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.rejectTrade(
        id,
        accountToken,
        body.reason,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Put(':id/cancel')
  async cancelTrade(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.cancelTrade(
        id,
        accountToken,
        body.reason,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Get(':id/history')
  async getNegotiationHistory(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.getNegotiationHistory(
        id,
        accountToken,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Get audit history for a trade
   * Returns a timeline of all actions performed on the trade
   */
  @Get(':id/audit-history')
  async getAuditHistory(
    @Param('id') id: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Query('action') action: string,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      // Verify user has access to this trade
      const tradeResult = await this.tradeService.getTradeById(
        id,
        accountToken,
      );
      if (tradeResult.statusCode !== 200) {
        return response.status(tradeResult.statusCode).json(tradeResult);
      }

      const result = await this.auditService.getAuditHistory(id, {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        action: action as any,
      });

      return response.status(200).json({
        statusCode: 200,
        message: 'Audit history retrieved successfully',
        data: result,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  // ========================
  // PHASE 2: Document Upload Endpoints
  // ========================

  /**
   * Upload SCO (Soft Corporate Offer) document
   * Only sellers can upload SCO after negotiation is accepted
   */
  @Post(':id/upload-sco')
  @UseInterceptors(FileUploadInterceptor)
  async uploadSCO(
    @Param('id') id: string,
    @Body() uploadDto: UploadSCODto,
    @UploadedFiles() files: Express.Multer.File[],
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      if (!files || files.length === 0) {
        return response.status(400).json({
          statusCode: 400,
          message: 'No file uploaded',
        });
      }

      const result = await this.tradeService.uploadDocument(
        id,
        accountToken,
        files[0],
        'sco',
        uploadDto,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return this.handleError(error, response, `uploadSCO(tradeId=${id})`);
    }
  }

  /**
   * Upload ICPO (Irrevocable Corporate Purchase Order) document
   * Only buyers can upload ICPO after receiving SCO
   */
  @Post(':id/upload-icpo')
  @UseInterceptors(FileUploadInterceptor)
  async uploadICPO(
    @Param('id') id: string,
    @Body() uploadDto: UploadICPODto,
    @UploadedFiles() files: Express.Multer.File[],
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      if (!files || files.length === 0) {
        return response.status(400).json({
          statusCode: 400,
          message: 'No file uploaded',
        });
      }

      const result = await this.tradeService.uploadDocument(
        id,
        accountToken,
        files[0],
        'icpo',
        uploadDto,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Upload SPA (Sales Purchase Agreement) document
   * Either party can upload SPA
   */
  @Post(':id/upload-spa')
  @UseInterceptors(FileUploadInterceptor)
  async uploadSPA(
    @Param('id') id: string,
    @Body() uploadDto: UploadSPADto,
    @UploadedFiles() files: Express.Multer.File[],
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      if (!files || files.length === 0) {
        return response.status(400).json({
          statusCode: 400,
          message: 'No file uploaded',
        });
      }

      const result = await this.tradeService.uploadDocument(
        id,
        accountToken,
        files[0],
        'spa',
        uploadDto,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * ========================
   * PHASE 2 REFACTORING: Upload Signed SPA
   * ========================
   * Buyer uploads their signed copy of the SPA after seller's SPA is approved
   * Flow: Seller uploads SPA → Buyer approves → Buyer uploads signed SPA → Seller approves
   */
  @Post(':id/upload-signed-spa')
  @UseInterceptors(FileUploadInterceptor)
  async uploadSignedSPA(
    @Param('id') id: string,
    @Body() uploadDto: UploadSPADto, // Reuse SPA DTO
    @UploadedFiles() files: Express.Multer.File[],
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      if (!files || files.length === 0) {
        return response.status(400).json({
          statusCode: 400,
          message: 'No file uploaded',
        });
      }

      const result = await this.tradeService.uploadSignedSpa(
        id,
        accountToken,
        files[0],
        uploadDto,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Upload BoL (Bill of Lading) document
   * Only sellers can upload BoL after payment is verified
   */
  @Post(':id/upload-bol')
  @UseInterceptors(FileUploadInterceptor)
  async uploadBoL(
    @Param('id') id: string,
    @Body() uploadDto: UploadBoLDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      if (!files || files.length === 0) {
        return response.status(400).json({
          statusCode: 400,
          message: 'No file uploaded',
        });
      }

      const result = await this.tradeService.uploadDocument(
        id,
        accountToken,
        files[0],
        'bol',
        uploadDto,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Upload Payment Proof document
   * Only buyers can upload payment proof
   */
  @Post(':id/upload-payment-proof')
  @UseInterceptors(FileUploadInterceptor)
  async uploadPaymentProof(
    @Param('id') id: string,
    @Body() uploadDto: UploadPaymentProofDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      if (!files || files.length === 0) {
        return response.status(400).json({
          statusCode: 400,
          message: 'No file uploaded',
        });
      }

      const result = await this.tradeService.uploadDocument(
        id,
        accountToken,
        files[0],
        'payment-proof',
        uploadDto,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Get all documents for a trade
   */
  @Get(':id/documents')
  async getTradeDocuments(@Param('id') id: string, @Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.getTradeDocuments(
        id,
        accountToken,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Download a specific document from a trade
   * Streams the file back to the client with proper Content-Disposition header
   */
  @Get(':id/document/:type/download')
  async downloadDocument(
    @Param('id') id: string,
    @Param('type') type: string,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const validTypes = ['sco', 'icpo', 'spa', 'bol', 'payment-proof'];
      if (!validTypes.includes(type)) {
        return response.status(400).json({
          statusCode: 400,
          message: `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
        });
      }

      const result = await this.tradeService.getDocumentForDownload(
        id,
        accountToken,
        type as 'sco' | 'icpo' | 'spa' | 'signed-spa' | 'bol' | 'payment-proof',
      );

      if (result.statusCode !== 200 || !result.data) {
        return response.status(result.statusCode).json(result);
      }

      const { stream, filename, mimeType } = result.data;

      // Set headers for file download
      response.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      });

      // Pipe the file stream to response
      stream.pipe(response);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Failed to download document',
      });
    }
  }

  /**
   * Get document version history
   */
  @Get(':id/document/:type/versions')
  async getDocumentVersions(
    @Param('id') id: string,
    @Param('type') type: string,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const validTypes = ['sco', 'icpo', 'spa', 'bol', 'payment-proof'];
      if (!validTypes.includes(type)) {
        return response.status(400).json({
          statusCode: 400,
          message: `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
        });
      }

      const result = await this.tradeService.getDocumentVersions(
        id,
        type as 'sco' | 'icpo' | 'spa' | 'signed-spa' | 'bol' | 'payment-proof',
        accountToken,
      );

      return response.status(200).json({
        statusCode: 200,
        message: 'Document versions retrieved successfully',
        data: result,
      });
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Failed to get document versions',
      });
    }
  }

  /**
   * Download a specific version of a document
   */
  @Get(':id/document/:type/version/:version/download')
  async downloadDocumentVersion(
    @Param('id') id: string,
    @Param('type') type: string,
    @Param('version') version: string,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const validTypes = ['sco', 'icpo', 'spa', 'bol', 'payment-proof'];
      if (!validTypes.includes(type)) {
        return response.status(400).json({
          statusCode: 400,
          message: `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
        });
      }

      const versionNum = parseInt(version, 10);
      if (isNaN(versionNum) || versionNum < 1) {
        return response.status(400).json({
          statusCode: 400,
          message: 'Invalid version number',
        });
      }

      const docInfo = await this.tradeService.downloadDocumentVersion(
        id,
        type as 'sco' | 'icpo' | 'spa' | 'signed-spa' | 'bol' | 'payment-proof',
        versionNum,
        accountToken,
      );

      // Stream the file using StorageService (supports local, S3, etc.)
      try {
        const stream = await this.storageService.getFileStream(
          docInfo.filePath,
        );

        response.set({
          'Content-Type': docInfo.mimeType,
          'Content-Disposition': `attachment; filename="${docInfo.originalName}"`,
        });

        stream.pipe(response);
      } catch (fileError) {
        this.logger.error(`Document file not found: ${docInfo.filePath}`);
        return response.status(404).json({
          statusCode: 404,
          message: 'Document file not found',
        });
      }
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Failed to download document version',
      });
    }
  }

  /**
   * Advance trade to next phase
   */
  @Put(':id/advance-phase')
  async advancePhase(
    @Param('id') id: string,
    @Body() advanceDto: AdvancePhaseDto,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.advanceTradePhase(
        id,
        accountToken,
        advanceDto.newPhase,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Complete trade (final step)
   */
  @Put(':id/complete')
  async completeTrade(@Param('id') id: string, @Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.completeTrade(id, accountToken);
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Generate and download invoice for a trade
   * Only available for completed trades or trades with accepted status
   */
  @Get(':id/invoice')
  async generateInvoice(@Param('id') id: string, @Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      // Get the trade with populated fields
      const tradeResult = await this.tradeService.getTradeById(
        id,
        accountToken,
      );

      if (tradeResult.statusCode !== 200 || !tradeResult.data) {
        return response.status(tradeResult.statusCode).json(tradeResult);
      }

      const trade = tradeResult.data;

      // Generate the PDF invoice (cast to any since data is populated from DB)
      const pdfBuffer = await this.invoiceService.generateInvoice(trade as any);

      // Set response headers for PDF download
      const orderId = `ORD-${id.slice(-8).toUpperCase()}`;
      response.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      return response.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating invoice:', error);
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Failed to generate invoice',
      });
    }
  }

  /**
   * Generate and download Purchase Request PDF
   * Available as soon as a trade is created (for both buyer and seller)
   */
  @Get(':id/purchase-request-pdf')
  async generatePurchaseRequestPDF(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      // Get the trade with populated fields
      const tradeResult = await this.tradeService.getTradeById(
        id,
        accountToken,
      );

      if (tradeResult.statusCode !== 200 || !tradeResult.data) {
        return response.status(tradeResult.statusCode).json(tradeResult);
      }

      const trade = tradeResult.data;

      // Generate the PDF Purchase Request
      const pdfBuffer = await this.invoiceService.generatePurchaseRequest(
        trade as any,
      );

      // Set response headers for PDF download
      const prNumber = `PR-${id.slice(-8).toUpperCase()}`;
      response.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="purchase-request-${prNumber}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      return response.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating purchase request PDF:', error);
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Failed to generate purchase request PDF',
      });
    }
  }

  /**
   * Generate and download Purchase Order PDF
   * Only available after negotiation is accepted (for both buyer and seller)
   */
  @Get(':id/purchase-order-pdf')
  async generatePurchaseOrderPDF(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      // Get the trade with populated fields
      const tradeResult = await this.tradeService.getTradeById(
        id,
        accountToken,
      );

      if (tradeResult.statusCode !== 200 || !tradeResult.data) {
        return response.status(tradeResult.statusCode).json(tradeResult);
      }

      const trade = tradeResult.data as any;

      // Check if trade has been accepted (PO is only available after acceptance)
      if (trade.negotiationStatus !== 'accepted') {
        return response.status(400).json({
          statusCode: 400,
          message:
            'Purchase Order is only available after the trade has been accepted',
        });
      }

      // Generate the PDF Purchase Order
      const pdfBuffer = await this.invoiceService.generatePurchaseOrder(trade);

      // Set response headers for PDF download
      const poNumber = `PO-${id.slice(-8).toUpperCase()}`;
      response.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="purchase-order-${poNumber}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      return response.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating purchase order PDF:', error);
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Failed to generate purchase order PDF',
      });
    }
  }

  /**
   * Verify or reject a document
   * SCO → Buyer verifies, ICPO → Seller verifies
   * Payment Proof → Seller verifies, BoL → Buyer verifies
   */
  @Put(':id/verify-document')
  async verifyDocument(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentStatusDto,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const result = await this.tradeService.verifyDocument(
        id,
        accountToken,
        updateDto.documentType,
        updateDto.status as 'approved' | 'rejected',
        updateDto.verificationNotes,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Sign a document with e-signature
   * - SCO: Seller signs
   * - ICPO: Buyer signs
   * - SPA: Either party can sign
   * - BoL: Seller signs
   */
  @Put(':id/document/:type/sign')
  async signDocument(
    @Param('id') id: string,
    @Param('type') type: string,
    @Body() signDto: SignDocumentDto,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      const validTypes = ['sco', 'icpo', 'spa', 'bol'];
      if (!validTypes.includes(type)) {
        return response.status(400).json({
          statusCode: 400,
          message: `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
        });
      }

      const result = await this.tradeService.signDocument(
        id,
        accountToken,
        type as DocumentType,
        signDto.signatureDataUrl,
      );
      return response.status(result.statusCode).json(result);
    } catch (error) {
      return response.status(error.status || 500).json({
        statusCode: error.status || 500,
        message: error.message || 'Internal server error',
      });
    }
  }

  // ========================
  // DISPUTE ENDPOINTS (User-facing)
  // ========================

  /**
   * Raise a dispute on a trade
   * Either buyer or seller can raise a dispute on their trade
   */
  @Post(':id/dispute')
  async raiseDispute(
    @Param('id') id: string,
    @Body() createDisputeDto: CreateDisputeDto,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      // First verify the user has access to this trade
      const tradeResult = await this.tradeService.getTradeById(
        id,
        accountToken,
      );
      if (tradeResult.statusCode !== 200) {
        return response.status(tradeResult.statusCode).json(tradeResult);
      }

      // Get user info from the trade result to determine role
      const trade = tradeResult.data as any;
      const userInfo = await this.tradeService.getUserFromToken(accountToken);

      if (!userInfo) {
        return response.status(401).json({
          statusCode: 401,
          message: 'Invalid authentication',
        });
      }

      // Determine if user is buyer or seller
      const isBuyer =
        trade.buyer?._id?.toString() === userInfo.userId.toString() ||
        trade.buyer?.toString() === userInfo.userId.toString();
      const isSeller =
        trade.seller?._id?.toString() === userInfo.userId.toString() ||
        trade.seller?.toString() === userInfo.userId.toString();

      if (!isBuyer && !isSeller) {
        return response.status(403).json({
          statusCode: 403,
          message: 'You are not authorized to raise a dispute on this trade',
        });
      }

      const userRole = isBuyer ? 'buyer' : 'seller';

      const dispute = await this.disputesService.createDispute(
        id,
        createDisputeDto,
        userInfo.userId.toString(),
        userInfo.email,
        userRole,
      );

      return response.status(201).json({
        statusCode: 201,
        message: 'Dispute raised successfully',
        data: dispute,
      });
    } catch (error) {
      return this.handleError(error, response, `raiseDispute(tradeId=${id})`);
    }
  }

  /**
   * Get dispute status for a trade
   * Returns the active or most recent dispute for this trade
   */
  @Get(':id/dispute')
  async getTradeDispute(@Param('id') id: string, @Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      // First verify the user has access to this trade
      const tradeResult = await this.tradeService.getTradeById(
        id,
        accountToken,
      );
      if (tradeResult.statusCode !== 200) {
        return response.status(tradeResult.statusCode).json(tradeResult);
      }

      const dispute = await this.disputesService.getDisputeByTrade(id);

      if (!dispute) {
        return response.status(200).json({
          statusCode: 200,
          message: 'No dispute found for this trade',
          data: null,
        });
      }

      // Get messages (excluding internal admin messages)
      const messages = await this.disputesService.getMessages(
        dispute._id.toString(),
        false,
      );

      return response.status(200).json({
        statusCode: 200,
        message: 'Dispute retrieved successfully',
        data: {
          ...dispute,
          messages,
        },
      });
    } catch (error) {
      return this.handleError(
        error,
        response,
        `getTradeDispute(tradeId=${id})`,
      );
    }
  }

  /**
   * Add a message to a dispute
   * Only the buyer or seller involved in the trade can add messages
   */
  @Post(':id/dispute/message')
  async addDisputeMessage(
    @Param('id') id: string,
    @Body() messageDto: AddDisputeMessageDto,
    @Res() response: Response,
  ) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      // First verify the user has access to this trade
      const tradeResult = await this.tradeService.getTradeById(
        id,
        accountToken,
      );
      if (tradeResult.statusCode !== 200) {
        return response.status(tradeResult.statusCode).json(tradeResult);
      }

      // Get the dispute for this trade
      const dispute = await this.disputesService.getDisputeByTrade(id);
      if (!dispute) {
        return response.status(404).json({
          statusCode: 404,
          message: 'No dispute found for this trade',
        });
      }

      // Get user info
      const trade = tradeResult.data as any;
      const userInfo = await this.tradeService.getUserFromToken(accountToken);

      if (!userInfo) {
        return response.status(401).json({
          statusCode: 401,
          message: 'Invalid authentication',
        });
      }

      // Determine if user is buyer or seller
      const isBuyer =
        trade.buyer?._id?.toString() === userInfo.userId.toString() ||
        trade.buyer?.toString() === userInfo.userId.toString();
      const isSeller =
        trade.seller?._id?.toString() === userInfo.userId.toString() ||
        trade.seller?.toString() === userInfo.userId.toString();

      if (!isBuyer && !isSeller) {
        return response.status(403).json({
          statusCode: 403,
          message: 'You are not authorized to add messages to this dispute',
        });
      }

      const userRole = isBuyer ? 'buyer' : 'seller';

      const message = await this.disputesService.addMessage(
        dispute._id.toString(),
        messageDto,
        userInfo.userId.toString(),
        userInfo.email,
        userRole,
      );

      return response.status(201).json({
        statusCode: 201,
        message: 'Message added successfully',
        data: message,
      });
    } catch (error) {
      return this.handleError(
        error,
        response,
        `addDisputeMessage(tradeId=${id})`,
      );
    }
  }

  /**
   * Get messages for a dispute
   * Returns all non-internal messages for the dispute on this trade
   */
  @Get(':id/dispute/messages')
  async getDisputeMessages(@Param('id') id: string, @Res() response: Response) {
    try {
      const accountToken = response.req.signedCookies['account'];

      if (!accountToken) {
        return response.status(401).json({
          statusCode: 401,
          message: 'No valid cookie found',
        });
      }

      // First verify the user has access to this trade
      const tradeResult = await this.tradeService.getTradeById(
        id,
        accountToken,
      );
      if (tradeResult.statusCode !== 200) {
        return response.status(tradeResult.statusCode).json(tradeResult);
      }

      // Get the dispute for this trade
      const dispute = await this.disputesService.getDisputeByTrade(id);
      if (!dispute) {
        return response.status(404).json({
          statusCode: 404,
          message: 'No dispute found for this trade',
        });
      }

      // Get messages (excluding internal admin messages)
      const messages = await this.disputesService.getMessages(
        dispute._id.toString(),
        false,
      );

      return response.status(200).json({
        statusCode: 200,
        message: 'Messages retrieved successfully',
        data: messages,
      });
    } catch (error) {
      return this.handleError(
        error,
        response,
        `getDisputeMessages(tradeId=${id})`,
      );
    }
  }
}
