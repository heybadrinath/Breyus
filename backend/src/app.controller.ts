import { Controller, Get, Post, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Breyus API',
      version: '1.0.0'
    };
  }

  @Post('setup-default-user')
  async setupDefaultUser() {
    try {
      // Check if default seller already exists
      const existingUser = await this.usersService.findByEmail('seller@example.com');
      
      if (existingUser) {
        return { 
          message: 'Default seller already exists', 
          user: {
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role
          }
        };
      }

      // Create default seller user
      const newUser = await this.usersService.create({
        email: 'seller@example.com',
        password: 'password123',
        firstName: 'Default',
        lastName: 'Seller',
        role: 'seller',
        isEmailVerified: true
      });

      this.logger.log('Default seller account created successfully');
      
      return { 
        message: 'Default seller created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role
        }
      };
    } catch (error) {
      this.logger.error(`Error creating default user: ${error.message}`);
      return { error: 'Failed to create default user', message: error.message };
    }
  }
}
