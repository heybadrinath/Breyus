import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';

// Mock UsersService
const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findUserDetailsById: jest.fn(),
  updateUserDetails: jest.fn(),
  validateCredentials: jest.fn(),
  updatePassword: jest.fn(),
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return health check response', () => {
      const result = appController.healthCheck();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'Breyus API');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('setup-default-user', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return existing user if already exists', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'seller@example.com',
        role: 'seller'
      };

      mockUsersService.findByEmail.mockResolvedValue(existingUser);

      const result = await appController.setupDefaultUser();

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('seller@example.com');
      expect(result.message).toBe('Default seller already exists');
      expect(result.user).toEqual(existingUser);
    });

    it('should create new default user if does not exist', async () => {
      const newUser = {
        id: 'user-456',
        email: 'seller@example.com',
        role: 'seller',
        firstName: 'Default',
        lastName: 'Seller'
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(newUser);

      const result = await appController.setupDefaultUser();

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('seller@example.com');
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'seller@example.com',
        password: 'password123',
        firstName: 'Default',
        lastName: 'Seller',
        role: 'seller',
        isEmailVerified: true
      });
      expect(result.message).toBe('Default seller created successfully');
      expect(result.user).toEqual({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      });
    });

    it('should handle errors during user creation', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockRejectedValue(new Error('Database error'));

      const result = await appController.setupDefaultUser();

      expect(result.error).toBe('Failed to create default user');
      expect(result.message).toBe('Database error');
    });
  });
});
