import { Controller, Get, Post, Put, Delete, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { CompanyService } from './company.service';
import { DeliveryAddress } from './company.schema';
import { AuthService } from '../auth/auth.service';

@Controller('company')
export class CompanyController {
    constructor(
        private readonly companyService: CompanyService,
        private readonly authService: AuthService
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

            const addresses = await this.companyService.getDeliveryAddresses(companyId);
            
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
    async addDeliveryAddress(@Body() address: DeliveryAddress, @Res() response: Response): Promise<void> {
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

            const company = await this.companyService.addDeliveryAddress(companyId, address);
            
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
        @Res() response: Response
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

            const company = await this.companyService.updateDeliveryAddress(companyId, addressIndex, address);
            
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
        @Res() response: Response
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

            const company = await this.companyService.deleteDeliveryAddress(companyId, addressIndex);
            
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
} 