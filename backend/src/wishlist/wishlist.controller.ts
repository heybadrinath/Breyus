import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Patch,
  HttpException,
  HttpStatus,
  Res,
  UseGuards,
} from '@nestjs/common';
import { WishlistService, SaveContactDto } from './wishlist.service';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { AuthGuard } from 'src/auth/auth.guard';

/**
 * Wishlist Controller
 * All routes are protected by AuthGuard which validates:
 * - Cookie-based JWT authentication
 * - User existence in database
 * - User is not suspended
 */
@Controller('wishlist')
@UseGuards(AuthGuard)
export class WishlistController {
  constructor(
    private readonly wishlistService: WishlistService,
    private readonly authService: AuthService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // HELPER: Extract user ID from cookie
  // ═══════════════════════════════════════════════════════════════
  private extractUserId(response: Response): string | null {
    const accountToken = response.req.signedCookies['account'];
    if (!accountToken) {
      return null;
    }
    try {
      const decoded = this.authService.validateAccountToken(accountToken);
      return (decoded as any).userId;
    } catch (error) {
      return null;
    }
  }

  @Post()
  async add(
    @Res() response: Response,
    @Body() body: { productId: string },
  ): Promise<void> {
    const accountToken = response.req.signedCookies['account'];
    if (!accountToken) {
      response.status(401).send('No valid cookie found');
      return;
    }
    // Verify JWT token and extract user ID
    let userId: string;
    try {
      const decoded = this.authService.validateAccountToken(accountToken);
      userId = (decoded as any).userId;
    } catch (error) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
      return;
    }
    try {
      const item = await this.wishlistService.addToWishlist(
        userId,
        body.productId,
      );
      response.json({ success: true, item });
    } catch (err) {
      response.status(400).json({ error: err.message });
    }
  }

  @Delete()
  async remove(@Res() response: Response, @Body() body: { productId: string }) {
    const accountToken = response.req.signedCookies['account'];
    if (!accountToken) {
      response.status(401).send('No valid cookie found');
      return;
    }
    let userId: string;
    try {
      const decoded = this.authService.validateAccountToken(accountToken);
      userId = (decoded as any).userId;
    } catch (error) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
      return;
    }
    try {
      const res = await this.wishlistService.removeFromWishlist(
        userId,
        body.productId,
      );
      response.json({ success: true, ...res });
    } catch (err) {
      response.status(err.status || 400).json({ error: err.message });
    }
  }

  @Get()
  async getOwnWishlist(@Res() response: Response) {
    const accountToken = response.req.signedCookies['account'];
    if (!accountToken) {
      response.status(401).send('No valid cookie found');
      return;
    }
    let userId: string;
    try {
      const decoded = this.authService.validateAccountToken(accountToken);
      userId = (decoded as any).userId;
    } catch (error) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
      return;
    }
    try {
      const products = await this.wishlistService.getUserWishlist(userId);
      response.json(products);
    } catch (err) {
      response.status(400).json({ error: err.message });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SAVED CONTACTS ENDPOINTS (for AI off-platform companies)
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /wishlist/contact
   * Save an AI contact (off-platform company) to wishlist
   */
  @Post('contact')
  async saveContact(
    @Res() response: Response,
    @Body() body: SaveContactDto,
  ): Promise<void> {
    const userId = this.extractUserId(response);
    if (!userId) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }

    try {
      const contact = await this.wishlistService.saveContact(userId, body);
      response.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Contact saved to wishlist',
        data: contact,
      });
    } catch (err) {
      const status = err.status || HttpStatus.BAD_REQUEST;
      response.status(status).json({
        statusCode: status,
        message: err.message,
      });
    }
  }

  /**
   * GET /wishlist/contacts
   * Get all saved contacts for the current user
   */
  @Get('contacts')
  async getSavedContacts(@Res() response: Response): Promise<void> {
    const userId = this.extractUserId(response);
    if (!userId) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }

    try {
      const contacts = await this.wishlistService.getSavedContacts(userId);
      response.json({
        statusCode: HttpStatus.OK,
        message: 'Saved contacts retrieved',
        data: contacts,
      });
    } catch (err) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: err.message,
      });
    }
  }

  /**
   * DELETE /wishlist/contact/:id
   * Remove a saved contact from wishlist
   */
  @Delete('contact/:id')
  async removeSavedContact(
    @Res() response: Response,
    @Param('id') contactId: string,
  ): Promise<void> {
    const userId = this.extractUserId(response);
    if (!userId) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }

    try {
      const result = await this.wishlistService.removeSavedContact(
        userId,
        contactId,
      );
      response.json({
        statusCode: HttpStatus.OK,
        ...result,
      });
    } catch (err) {
      const status = err.status || HttpStatus.BAD_REQUEST;
      response.status(status).json({
        statusCode: status,
        message: err.message,
      });
    }
  }

  /**
   * PATCH /wishlist/contact/:id/notes
   * Update notes for a saved contact
   */
  @Patch('contact/:id/notes')
  async updateContactNotes(
    @Res() response: Response,
    @Param('id') contactId: string,
    @Body() body: { notes: string },
  ): Promise<void> {
    const userId = this.extractUserId(response);
    if (!userId) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }

    try {
      const result = await this.wishlistService.updateContactNotes(
        userId,
        contactId,
        body.notes,
      );
      response.json({
        statusCode: HttpStatus.OK,
        message: 'Contact notes updated',
        data: result,
      });
    } catch (err) {
      const status = err.status || HttpStatus.BAD_REQUEST;
      response.status(status).json({
        statusCode: status,
        message: err.message,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FAVOURITE COMPANIES ENDPOINTS (platform companies)
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /wishlist/favourite-company
   * Add a company to favourites
   */
  @Post('favourite-company')
  async addFavouriteCompany(
    @Res() response: Response,
    @Body() body: { companyId: string; notes?: string },
  ): Promise<void> {
    const userId = this.extractUserId(response);
    if (!userId) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }

    try {
      const favourite = await this.wishlistService.addFavouriteCompany(
        userId,
        body.companyId,
        body.notes,
      );
      response.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Company added to favourites',
        data: favourite,
      });
    } catch (err) {
      const status = err.status || HttpStatus.BAD_REQUEST;
      response.status(status).json({
        statusCode: status,
        message: err.message,
      });
    }
  }

  /**
   * DELETE /wishlist/favourite-company/:companyId
   * Remove a company from favourites
   */
  @Delete('favourite-company/:companyId')
  async removeFavouriteCompany(
    @Res() response: Response,
    @Param('companyId') companyId: string,
  ): Promise<void> {
    const userId = this.extractUserId(response);
    if (!userId) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }

    try {
      const result = await this.wishlistService.removeFavouriteCompany(
        userId,
        companyId,
      );
      response.json({
        statusCode: HttpStatus.OK,
        ...result,
      });
    } catch (err) {
      const status = err.status || HttpStatus.BAD_REQUEST;
      response.status(status).json({
        statusCode: status,
        message: err.message,
      });
    }
  }

  /**
   * GET /wishlist/favourite-companies
   * Get all favourite companies for the current user
   */
  @Get('favourite-companies')
  async getFavouriteCompanies(@Res() response: Response): Promise<void> {
    const userId = this.extractUserId(response);
    if (!userId) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }

    try {
      const companies =
        await this.wishlistService.getFavouriteCompanies(userId);
      response.json({
        statusCode: HttpStatus.OK,
        message: 'Favourite companies retrieved',
        data: companies,
      });
    } catch (err) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: err.message,
      });
    }
  }

  /**
   * GET /wishlist/favourite-company/:companyId/check
   * Check if a company is favourited by the current user
   */
  @Get('favourite-company/:companyId/check')
  async checkIsFavouriteCompany(
    @Res() response: Response,
    @Param('companyId') companyId: string,
  ): Promise<void> {
    const userId = this.extractUserId(response);
    if (!userId) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }

    try {
      const isFavourite = await this.wishlistService.isFavouriteCompany(
        userId,
        companyId,
      );
      response.json({
        statusCode: HttpStatus.OK,
        data: { isFavourite },
      });
    } catch (err) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: err.message,
      });
    }
  }
}
