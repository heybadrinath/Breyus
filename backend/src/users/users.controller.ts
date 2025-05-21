import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, NotFoundException, Logger, HttpException, HttpStatus } from '@nestjs/common';
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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Get(':id/details')
  async getUserWithDetails(@Param('id') id: string) {
    try {
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
  create(@Body() createUserDto: Partial<User>): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: Partial<User>): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/details')
  @UseGuards(JwtAuthGuard)
  async updateUserDetails(
    @Param('id') id: string,
    @Body() userDetailsDto: UserDetailsDto
  ) {
    try {
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
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
} 