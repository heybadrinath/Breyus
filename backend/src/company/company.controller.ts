import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Res,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CompanyService } from './company.service';
import { DeliveryAddress, KycDocumentType } from './company.schema';
import { AuthService } from '../auth/auth.service';
import { StorageService } from '../common/storage/storage.service';
import { FileUploadInterceptor } from '../products/file-upload.interceptor';
import { DocumentUploadInterceptor } from '../common/interceptors/document-upload.interceptor';
import { AuthGuard } from '../auth/auth.guard';

/**
 * Company Controller
 * All routes are protected by AuthGuard which validates:
 * - Cookie-based JWT authentication
 * - User existence in database
 * - User is not suspended
 */
@Controller('company')
@UseGuards(AuthGuard)
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
  ) {}

  @Get('delivery-addresses')
  async getDeliveryAddresses(@Res() response: Response): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      const addresses =
        await this.companyService.getDeliveryAddresses(companyId);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Delivery addresses retrieved successfully',
        data: addresses,
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get delivery addresses',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Post('delivery-addresses')
  async addDeliveryAddress(
    @Body() address: DeliveryAddress,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      const company = await this.companyService.addDeliveryAddress(
        companyId,
        address,
      );

      response.status(HttpStatus.CREATED).send({
        statusCode: HttpStatus.CREATED,
        message: 'Delivery address added successfully',
        data: company.deliveryAddresses,
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to add delivery address',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Put('delivery-addresses/:index')
  async updateDeliveryAddress(
    @Param('index') index: string,
    @Body() address: DeliveryAddress,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      const addressIndex = parseInt(index);
      if (isNaN(addressIndex)) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid address index',
        });
        return;
      }

      const company = await this.companyService.updateDeliveryAddress(
        companyId,
        addressIndex,
        address,
      );

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Delivery address updated successfully',
        data: company.deliveryAddresses,
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update delivery address',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Delete('delivery-addresses/:index')
  async deleteDeliveryAddress(
    @Param('index') index: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      const addressIndex = parseInt(index);
      if (isNaN(addressIndex)) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid address index',
        });
        return;
      }

      const company = await this.companyService.deleteDeliveryAddress(
        companyId,
        addressIndex,
      );

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Delivery address deleted successfully',
        data: company.deliveryAddresses,
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete delivery address',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Get('profile')
  async getProfile(@Res() response: Response): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      const profile = await this.companyService.getProfile(companyId);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Company profile retrieved successfully',
        data: profile,
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get company profile',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  /**
   * Get public company profile by ID
   * Returns only non-sensitive fields visible to other users
   * Validates that the company is a seller before returning
   */
  @Get('public/:companyId')
  async getPublicProfile(
    @Param('companyId') companyId: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      // Validate the token (user must be logged in)
      try {
        this.authService.validateAccountToken(accountToken);
      } catch (error) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      const publicProfile =
        await this.companyService.getPublicProfile(companyId);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Public company profile retrieved successfully',
        data: publicProfile,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      response.status(status).send({
        statusCode: status,
        message: error.message || 'Failed to get public company profile',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  /**
   * Get public profile for a buyer company (used by sellers viewing buyer profiles)
   */
  @Get('buyer-public/:companyId')
  async getBuyerPublicProfile(
    @Param('companyId') companyId: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      // Validate the token (user must be logged in as a seller)
      try {
        const decoded = this.authService.validateAccountToken(accountToken);
        // Could add additional validation here to ensure viewer is a seller
      } catch {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid or expired token',
        });
        return;
      }

      const publicProfile =
        await this.companyService.getBuyerPublicProfile(companyId);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Buyer company profile retrieved successfully',
        data: publicProfile,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      response.status(status).send({
        statusCode: status,
        message: error.message || 'Failed to get buyer company profile',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Put('profile')
  async updateProfile(
    @Body() profileData: any,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      const updatedProfile = await this.companyService.updateProfile(
        companyId,
        profileData,
      );

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Company profile updated successfully',
        data: updatedProfile,
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update company profile',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Post('upload-cis')
  @UseInterceptors(DocumentUploadInterceptor)
  async uploadCisDocument(
    @UploadedFiles() files: Express.Multer.File[],
    @Res() response: Response,
  ): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      if (!files || files.length === 0) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'No file provided',
        });
        return;
      }

      const file = files[0];
      const filename = `cis-${companyId}-${Date.now()}-${file.originalname}`;
      const filePath = await this.storageService.upload(
        file.buffer,
        filename,
        'cis-documents',
      );
      const fileUrl = this.storageService.getUrl(filePath);

      // Update tradeDetails with CIS document URL
      const updatedProfile = await this.companyService.updateProfile(
        companyId,
        {
          tradeDetails: {
            cisDocument: fileUrl,
          },
        } as any,
      );

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'CIS document uploaded successfully',
        data: {
          cisDocument: fileUrl,
          profile: updatedProfile,
        },
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to upload CIS document',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  // KYC Document Endpoints (Phase 4)

  @Get('kyc-documents')
  async getKycDocuments(@Res() response: Response): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      const documents = await this.companyService.getKycDocuments(companyId);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'KYC documents retrieved successfully',
        data: documents,
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get KYC documents',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Get('kyc-documents/cis-status')
  async getCisStatus(@Res() response: Response): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      const cisStatus = await this.companyService.getCisStatus(companyId);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'CIS status retrieved successfully',
        data: cisStatus,
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get CIS status',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Get('kyc-status')
  async getKycStatus(@Res() response: Response): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      const status = await this.companyService.getKycStatus(companyId);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'KYC status retrieved successfully',
        data: status,
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get KYC status',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Post('kyc-documents')
  @UseInterceptors(DocumentUploadInterceptor)
  async uploadKycDocument(
    @UploadedFiles() files: Express.Multer.File[],
    @Body()
    body: { documentType: string; customName: string; description?: string },
    @Res() response: Response,
  ): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      if (!files || files.length === 0) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'No file provided',
        });
        return;
      }

      // Only allow new document types (cis, product_catalog, other)
      // Legacy types (passport, tax_certificate, business_registration) are not uploadable
      const allowedTypes = [
        KycDocumentType.CIS,
        KycDocumentType.PRODUCT_CATALOG,
        KycDocumentType.OTHER,
      ];
      if (
        !body.documentType ||
        !allowedTypes.includes(body.documentType as KycDocumentType)
      ) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Invalid document type. Must be one of: ${allowedTypes.join(', ')}`,
        });
        return;
      }

      if (!body.customName || body.customName.trim().length === 0) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Document name is required',
        });
        return;
      }

      const file = files[0];
      const filename = `kyc-${companyId}-${Date.now()}-${file.originalname}`;
      const filePath = await this.storageService.upload(
        file.buffer,
        filename,
        'kyc-documents',
      );
      const fileUrl = this.storageService.getUrl(filePath);

      const document = await this.companyService.addKycDocument(companyId, {
        type: body.documentType as KycDocumentType,
        customName: body.customName.trim(),
        description: body.description,
        filename: filename,
        originalName: file.originalname,
        path: fileUrl,
        mimeType: file.mimetype,
        size: file.size,
      });

      response.status(HttpStatus.CREATED).send({
        statusCode: HttpStatus.CREATED,
        message: 'KYC document uploaded successfully',
        data: document,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      response.status(status).send({
        statusCode: status,
        message: error.message || 'Failed to upload KYC document',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Delete('kyc-documents/:docId')
  async deleteKycDocument(
    @Param('docId') docId: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      await this.companyService.deleteKycDocument(companyId, docId);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'KYC document deleted successfully',
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      response.status(status).send({
        statusCode: status,
        message: error.message || 'Failed to delete KYC document',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  // Profile Media Endpoints (Settings Page)

  @Post('upload-profile-picture')
  @UseInterceptors(FileUploadInterceptor)
  async uploadProfilePicture(
    @UploadedFiles() files: Express.Multer.File[],
    @Res() response: Response,
  ): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      if (!files || files.length === 0) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'No file provided',
        });
        return;
      }

      const file = files[0];

      // Validate image type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'File size exceeds 5MB limit',
        });
        return;
      }

      const filename = `profile-${companyId}-${Date.now()}-${file.originalname}`;
      const filePath = await this.storageService.upload(
        file.buffer,
        filename,
        'profile-pictures',
      );
      const fileUrl = this.storageService.getUrl(filePath);

      await this.companyService.uploadProfilePicture(companyId, fileUrl);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Profile picture uploaded successfully',
        data: { profilePicture: fileUrl },
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to upload profile picture',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Post('upload-banner')
  @UseInterceptors(FileUploadInterceptor)
  async uploadBanner(
    @UploadedFiles() files: Express.Multer.File[],
    @Res() response: Response,
  ): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      if (!files || files.length === 0) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'No file provided',
        });
        return;
      }

      const file = files[0];

      // Validate image type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        });
        return;
      }

      // Validate file size (max 10MB for banner)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'File size exceeds 10MB limit',
        });
        return;
      }

      const filename = `banner-${companyId}-${Date.now()}-${file.originalname}`;
      const filePath = await this.storageService.upload(
        file.buffer,
        filename,
        'banners',
      );
      const fileUrl = this.storageService.getUrl(filePath);

      await this.companyService.uploadBanner(companyId, fileUrl);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Banner image uploaded successfully',
        data: { bannerImage: fileUrl },
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to upload banner image',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Delete('profile-picture')
  async deleteProfilePicture(@Res() response: Response): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      await this.companyService.deleteProfilePicture(companyId);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Profile picture deleted successfully',
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete profile picture',
        error: error.message || 'Internal Server Error',
      });
    }
  }

  @Delete('banner')
  async deleteBanner(@Res() response: Response): Promise<void> {
    try {
      const accountToken = response.req.signedCookies['account'];
      if (!accountToken) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No valid cookie found',
        });
        return;
      }

      const decoded = this.authService.validateAccountToken(accountToken);
      const companyId = (decoded as any).companyId;

      if (!companyId) {
        response.status(HttpStatus.UNAUTHORIZED).send({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        });
        return;
      }

      await this.companyService.deleteBanner(companyId);

      response.status(HttpStatus.OK).send({
        statusCode: HttpStatus.OK,
        message: 'Banner image deleted successfully',
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete banner image',
        error: error.message || 'Internal Server Error',
      });
    }
  }
}
