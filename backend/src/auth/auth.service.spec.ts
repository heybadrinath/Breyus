import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';

// Mock MailService
const mockMailService = {
  sendOtp: jest.fn(),
  sendPasswordResetOtp: jest.fn(),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('forgotPassword', () => {
    it('should send a password reset OTP email', async () => {
      // Reset mock counters
      mockMailService.sendPasswordResetOtp.mockReset();
      
      // Test data
      const email = 'test@example.com';
      
      // Call the function
      const result = await service.forgotPassword(email);
      
      // Verify mail service was called
      expect(mockMailService.sendPasswordResetOtp).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendPasswordResetOtp).toHaveBeenCalledWith(email, expect.any(String));
      
      // Verify result
      expect(result).toEqual({ message: 'Password reset instructions sent to your email' });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid OTP', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      const newPassword = 'newSecurePassword123';
      
      // Manually set the OTP
      await service.forgotPassword(email);
      
      // Get the OTP from the service (this is a workaround for testing)
      const storedOtp = (service as any).resetOtpStore.get(email);
      
      // Call reset with the correct OTP
      const result = await service.resetPassword(email, storedOtp, newPassword);
      
      // Verify result
      expect(result).toEqual({ message: 'Password reset successful', success: true });
    });
  });
});
