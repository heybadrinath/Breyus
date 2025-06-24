import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { JwtService } from './jwt/jwt.service';
import { NotFoundException } from '@nestjs/common';

// Mock MailService
const mockMailService = {
  sendOtp: jest.fn(),
  sendPasswordResetOtp: jest.fn(),
};

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

// Mock JwtService
const mockJwtService = {
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('forgotPassword', () => {
    it('should send a password reset OTP email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-123',
        email: email,
        role: 'buyer'
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      
      const result = await service.forgotPassword(email);
      
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockMailService.sendPasswordResetOtp).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendPasswordResetOtp).toHaveBeenCalledWith(email, expect.any(String));
      expect(result).toEqual({ message: 'Password reset instructions sent to your email' });
    });

    it('should throw NotFoundException for non-existent email', async () => {
      const email = 'nonexistent@example.com';
      
      mockUsersService.findByEmail.mockResolvedValue(null);
      
      await expect(service.forgotPassword(email)).rejects.toThrow(NotFoundException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockMailService.sendPasswordResetOtp).not.toHaveBeenCalled();
    });

    it('should validate role if provided', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-123',
        email: email,
        role: 'buyer'
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      
      const result = await service.forgotPassword(email, 'buyer');
      
      expect(result).toEqual({ message: 'Password reset instructions sent to your email' });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid OTP', async () => {
      const email = 'test@example.com';
      const newPassword = 'newSecurePassword123';
      const mockUser = {
        id: 'user-123',
        email: email,
        role: 'buyer'
      };
      
      // First set up the forgot password to generate OTP
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      await service.forgotPassword(email);
      
      // Get the OTP from the service (this is a workaround for testing)
      const storedOtp = (service as any).resetOtpStore.get(email);
      
      // Call reset with the correct OTP
      const result = await service.resetPassword(email, storedOtp, newPassword);
      
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(mockUser.id, newPassword);
      expect(result).toEqual({ message: 'Password reset successful', success: true });
    });

    it('should throw error for invalid OTP', async () => {
      const email = 'test@example.com';
      const invalidOtp = '000000';
      const newPassword = 'newSecurePassword123';
      
      await expect(service.resetPassword(email, invalidOtp, newPassword)).rejects.toThrow();
    });
  });

  describe('generateOtpAndSend', () => {
    it('should generate and send OTP for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = {
        id: 'user-123',
        email: email,
        role: 'buyer'
      };

      mockUsersService.validateCredentials.mockResolvedValue(mockUser);
      
      const result = await service.generateOtpAndSend(email, password);
      
      expect(mockUsersService.validateCredentials).toHaveBeenCalledWith(email, password);
      expect(mockMailService.sendOtp).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should throw error for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      mockUsersService.validateCredentials.mockResolvedValue(null);
      
      await expect(service.generateOtpAndSend(email, password)).rejects.toThrow();
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return login success', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = {
        id: 'user-123',
        email: email,
        role: 'buyer',
        firstName: 'Test',
        lastName: 'User'
      };
      const mockToken = 'jwt-token-123';

      mockUsersService.validateCredentials.mockResolvedValue(mockUser);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.findUserDetailsById.mockRejectedValue(new NotFoundException());
      mockUsersService.updateUserDetails.mockResolvedValue({});
      mockJwtService.generateToken.mockReturnValue(mockToken);
      
      // First generate OTP
      await service.generateOtpAndSend(email, password);
      const storedOtp = (service as any).otpStore.get(email);
      
      const result = await service.verifyOtp(email, storedOtp);
      
      expect(result.success).toBe(true);
      expect(result.token).toBe(mockToken);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
      });
    });
  });

  describe('register', () => {
    it('should initiate registration process', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';
      const firstName = 'New';
      const lastName = 'User';

      mockUsersService.findByEmail.mockResolvedValue(null);
      
      const result = await service.register(email, password, firstName, lastName, 'buyer');
      
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockMailService.sendOtp).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: 'Verification OTP sent to your email', success: true });
    });

    it('should throw error for existing email', async () => {
      const email = 'existing@example.com';
      const password = 'password123';
      const mockUser = { id: 'user-123', email: email };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      
      await expect(service.register(email, password)).rejects.toThrow();
    });
  });

  describe('validateToken', () => {
    it('should validate valid token', async () => {
      const token = 'valid-token';
      const mockDecoded = { id: 'user-123', email: 'test@example.com', role: 'buyer' };
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'buyer'
      };

      mockJwtService.verifyToken.mockReturnValue(mockDecoded);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      
      const result = await service.validateToken(token);
      
      expect(result.valid).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role
      });
    });

    it('should return invalid for bad token', async () => {
      const token = 'invalid-token';

      mockJwtService.verifyToken.mockReturnValue(null);
      
      const result = await service.validateToken(token);
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid token');
    });
  });
});
