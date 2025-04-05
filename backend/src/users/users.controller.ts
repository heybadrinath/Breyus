import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserDetailsDto } from './dto/user-details.dto';

// In a real application, you would have authentication guards here
// @UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Get(':id/details')
  async getUserWithDetails(@Param('id') id: string) {
    return this.usersService.getUserWithDetails(id);
  }

  @Post()
  create(@Body() createUserDto: Partial<User>): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: Partial<User>): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/details')
  async updateUserDetails(
    @Param('id') id: string,
    @Body() userDetailsDto: UserDetailsDto
  ) {
    return this.usersService.updateUserDetails(id, userDetailsDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
} 