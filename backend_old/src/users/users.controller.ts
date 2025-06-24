import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, NotFoundException, Logger, HttpException, HttpStatus, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserDetailsDto } from './dto/user-details.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// In a real application, you would have authentication guards here
// @UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard) 
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // Get current user's details using JWT token
  @Get('me/details')
  @UseGuards(JwtAuthGuard)
  async getMyDetails(@Request() req) {
    try {
      const userId = req.user.id;
      this.logger.log(`Getting details for current user ${userId}`);
      return await this.usersService.getUserWithDetails(userId);
    } catch (error) {
      this.logger.error(`Error getting details for current user: ${error.message}`);
      throw new HttpException(
        'Failed to fetch user details',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Create a new endpoint to update user's own details using JWT token
  // Must be defined BEFORE the parameterized routes
  @Put('me/details')
  @UseGuards(JwtAuthGuard)
  async updateMyDetails(
    @Body() userDetailsDto: UserDetailsDto,
    @Request() req
  ) {
    try {
      const userId = req.user.id;
      this.logger.log(`User ${userId} updating their own details`);
      return await this.usersService.updateUserDetails(userId, userDetailsDto);
    } catch (error) {
      this.logger.error(`Error updating details for current user: ${error.message}`);
      throw new HttpException(
        'Failed to update user details',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req): Promise<User> {
    // Check if user is trying to access their own data or has admin privileges
    if (req.user.id !== id && req.user.role !== 'admin') {
      this.logger.warn(`User ${req.user.id} attempted to access user ${id} data`);
      throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
    }
    return this.usersService.findOne(id);
  }

  @Get(':id/details')
  @UseGuards(JwtAuthGuard)
  async getUserWithDetails(@Param('id') id: string, @Request() req) {
    try {
      // Check if user is trying to access their own data or has admin privileges
      if (req.user.id !== id && req.user.role !== 'admin') {
        this.logger.warn(`User ${req.user.id} attempted to access details for user ${id}`);
        throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
      }

      this.logger.log(`Getting details for user ${id}`);
      const result = await this.usersService.getUserWithDetails(id);
      return result;
    } catch (error) {
      this.logger.error(`Error getting details for user ${id}: ${error.message}`);
      
      if (error instanceof NotFoundException) {
        // Return empty details instead of throwing an error
        return {
          details: {},
          message: 'User not found, but returning empty details for UI rendering'
        };
      }
      
      throw new HttpException(
        'Failed to fetch user details',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createUserDto: Partial<User>, @Request() req): Promise<User> {
    // Only admin users can create new users
    if (req.user.role !== 'admin') {
      throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
    }
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string, 
    @Body() updateUserDto: Partial<User>,
    @Request() req
  ): Promise<User> {
    // Check if user is updating their own data or has admin privileges
    if (req.user.id !== id && req.user.role !== 'admin') {
      this.logger.warn(`User ${req.user.id} attempted to update user ${id}`);
      throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/details')
  @UseGuards(JwtAuthGuard)
  async updateUserDetails(
    @Param('id') id: string,
    @Body() userDetailsDto: UserDetailsDto,
    @Request() req
  ) {
    try {
      // Check if user is updating their own details or has admin privileges
      if (req.user.id !== id && req.user.role !== 'admin') {
        this.logger.warn(`User ${req.user.id} attempted to update details for user ${id}`);
        throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
      }

      this.logger.log(`User ${req.user.id} updating details for user ${id}`);
      return await this.usersService.updateUserDetails(id, userDetailsDto);
    } catch (error) {
      this.logger.error(`Error updating details for user ${id}: ${error.message}`);
      throw new HttpException(
        'Failed to update user details',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    // Only admin users can delete users
    if (req.user.role !== 'admin') {
      throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
    }
    return this.usersService.remove(id);
  }
} 