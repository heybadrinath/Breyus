import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// Mock AuthService
const mockAuthService = {
  generateOtpAndSend: jest.fn(),
  verifyOtp: jest.fn(),
  validateToken: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  register: jest.fn(),
  verifyRegistrationOtp: jest.fn(),
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

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should handle login with OTP generation and verification', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
        role: 'buyer'
      };

      const mockLoginResponse = {
        message: 'Login successful',
        success: true,
        token: 'jwt-token-123',
        user: {
          id: 'user-123',
          email: loginDto.email,
          firstName: 'Test',
          lastName: 'User',
          role: 'buyer'
        }
      };

      mockAuthService.generateOtpAndSend.mockResolvedValue({ message: 'OTP sent successfully' });
      mockAuthService.verifyOtp.mockResolvedValue(mockLoginResponse);

      // Mock the internal OTP store access
      (controller as any).authService = {
        ...mockAuthService,
        otpStore: new Map([['test@example.com', '123456']])
      };

      const result = await controller.login(loginDto);

      expect(mockAuthService.generateOtpAndSend).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        loginDto.role
      );
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle login error', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockAuthService.generateOtpAndSend.mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('sendOTP', () => {
    it('should send OTP', async () => {
      const otpDto = {
        email: 'test@example.com',
        password: 'password123',
        role: 'buyer'
      };

      const mockResponse = { message: 'OTP sent successfully' };
      mockAuthService.generateOtpAndSend.mockResolvedValue(mockResponse);

      const result = await controller.sendOTP(otpDto);

      expect(mockAuthService.generateOtpAndSend).toHaveBeenCalledWith(
        otpDto.email,
        otpDto.password,
        otpDto.role
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP', async () => {
      const verifyDto = {
        email: 'test@example.com',
        otp: '123456'
      };

      const mockResponse = {
        message: 'Login successful',
        success: true,
        token: 'jwt-token-123'
      };
      mockAuthService.verifyOtp.mockResolvedValue(mockResponse);

      const result = await controller.verifyOTP(verifyDto);

      expect(mockAuthService.verifyOtp).toHaveBeenCalledWith(verifyDto.email, verifyDto.otp);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('validateToken', () => {
    it('should validate token from authorization header', async () => {
      const authHeader = 'Bearer jwt-token-123';
      const mockResponse = {
        valid: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'buyer'
        }
      };

      mockAuthService.validateToken.mockResolvedValue(mockResponse);

      const result = await controller.validateToken(authHeader);

      expect(mockAuthService.validateToken).toHaveBeenCalledWith('jwt-token-123');
      expect(result).toEqual(mockResponse);
    });

    it('should handle missing authorization header', async () => {
      const result = await controller.validateToken(null as any);

      expect(result).toEqual({
        valid: false,
        message: 'No token provided'
      });
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset', async () => {
      const forgotPasswordDto = {
        email: 'test@example.com',
        role: 'buyer'
      };

      const mockResponse = { message: 'Password reset instructions sent to your email' };
      mockAuthService.forgotPassword.mockResolvedValue(mockResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto.email,
        forgotPasswordDto.role
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const resetPasswordDto = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'newPassword123',
        role: 'buyer'
      };

      const mockResponse = { message: 'Password reset successful', success: true };
      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.email,
        resetPasswordDto.otp,
        resetPasswordDto.newPassword,
        resetPasswordDto.role
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registrationDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'buyer'
      };

      const mockResponse = { message: 'Verification OTP sent to your email', success: true };
      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registrationDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        registrationDto.email,
        registrationDto.password,
        registrationDto.firstName,
        registrationDto.lastName,
        registrationDto.role
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration error', async () => {
      const registrationDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'buyer'
      };

      const error = new Error('Email already registered') as any;
      error.status = 401;
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(registrationDto)).rejects.toThrow();
    });
  });

  describe('verifyRegistrationOtp', () => {
    it('should verify registration OTP', async () => {
      const verifyDto = {
        email: 'newuser@example.com',
        otp: '123456'
      };

      const mockResponse = {
        message: 'Registration successful',
        success: true,
        token: 'jwt-token-123'
      };
      mockAuthService.verifyRegistrationOtp.mockResolvedValue(mockResponse);

      const result = await controller.verifyRegistrationOtp(verifyDto);

      expect(mockAuthService.verifyRegistrationOtp).toHaveBeenCalledWith(
        verifyDto.email,
        verifyDto.otp
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle OTP verification error', async () => {
      const verifyDto = {
        email: 'newuser@example.com',
        otp: 'invalid'
      };

      mockAuthService.verifyRegistrationOtp.mockRejectedValue(new Error('Invalid OTP'));

      await expect(controller.verifyRegistrationOtp(verifyDto)).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateProfileDto = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockRequest = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'buyer'
        }
      };

      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        role: 'buyer'
      };

      mockUsersService.update.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateProfile(mockRequest, updateProfileDto);

      expect(mockUsersService.update).toHaveBeenCalledWith('user-123', {
        firstName: 'Updated',
        lastName: 'Name'
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile updated successfully');
      expect(result.user).toEqual(mockUpdatedUser);
    });

    it('should handle profile update error', async () => {
      const updateProfileDto = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const mockRequest = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'buyer'
        }
      };

      mockUsersService.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.updateProfile(mockRequest, updateProfileDto)).rejects.toThrow();
    });
  });
});
