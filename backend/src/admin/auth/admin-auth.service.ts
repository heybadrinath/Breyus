import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AdminUser } from './schemas/admin-user.schema';
import { AdminSession, DeviceInfo } from './schemas/admin-session.schema';

const SESSION_EXPIRY_MS =
  Number(process.env.ADMIN_SESSION_EXPIRY) || 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUser>,
    @InjectModel(AdminSession.name)
    private adminSessionModel: Model<AdminSession>,
  ) {}

  /**
   * Authenticate admin with email and password
   * Returns session token on success
   */
  async login(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ admin: Partial<AdminUser>; token: string }> {
    const admin = await this.adminUserModel
      .findOne({ email: email.toLowerCase() })
      .exec();

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const remainingMs = admin.lockUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new HttpException(
        `Account is locked. Try again in ${remainingMin} minute(s)`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;

      if (admin.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        admin.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      }

      await admin.save();
      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failed attempts on successful login
    admin.failedLoginAttempts = 0;
    admin.lockUntil = null as any;
    admin.lastLogin = new Date();
    await admin.save();

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Parse user agent for device info
    const deviceInfo = this.parseUserAgent(userAgent);

    // Create session
    const session = new this.adminSessionModel({
      adminId: admin._id,
      tokenHash,
      deviceInfo,
      ipAddress,
      userAgent,
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
    });
    await session.save();

    return {
      admin: {
        _id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      token,
    };
  }

  /**
   * Validate session token and return admin user
   */
  async validateToken(token: string): Promise<AdminUser> {
    if (!token) {
      throw new UnauthorizedException('No session token provided');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await this.adminSessionModel
      .findOne({
        tokenHash,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Update last activity
    session.lastActivityAt = new Date();
    await session.save();

    const admin = await this.adminUserModel.findById(session.adminId).exec();

    if (!admin) {
      throw new UnauthorizedException('Admin user not found');
    }

    return admin;
  }

  /**
   * Get current admin info
   */
  async getMe(token: string): Promise<Partial<AdminUser>> {
    const admin = await this.validateToken(token);

    return {
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
    };
  }

  /**
   * Logout - delete session
   */
  async logout(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.adminSessionModel.deleteOne({ tokenHash }).exec();
  }

  /**
   * Change admin password
   */
  async changePassword(
    token: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const admin = await this.validateToken(token);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    // Optionally: Invalidate all other sessions
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.adminSessionModel
      .deleteMany({
        adminId: admin._id,
        tokenHash: { $ne: tokenHash },
      })
      .exec();
  }

  /**
   * Get all sessions for an admin
   */
  async getSessions(adminId: Types.ObjectId): Promise<AdminSession[]> {
    return this.adminSessionModel
      .find({ adminId, expiresAt: { $gt: new Date() } })
      .select('-tokenHash')
      .sort({ lastActivityAt: -1 })
      .exec();
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(
    sessionId: string,
    adminId: Types.ObjectId,
  ): Promise<void> {
    await this.adminSessionModel
      .deleteOne({
        _id: sessionId,
        adminId,
      })
      .exec();
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllOtherSessions(token: string): Promise<void> {
    const admin = await this.validateToken(token);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.adminSessionModel
      .deleteMany({
        adminId: admin._id,
        tokenHash: { $ne: tokenHash },
      })
      .exec();
  }

  /**
   * Parse user agent for device info
   */
  private parseUserAgent(userAgent: string): DeviceInfo {
    const browserMatch = userAgent.match(
      /(Chrome|Firefox|Safari|Edge|Opera)[\/\s](\d+)/,
    );
    const osMatch = userAgent.match(
      /(Windows NT|Mac OS X|Linux|Android|iOS)[\s]?([0-9._]*)/,
    );

    let device = 'Desktop';
    if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
      device = /iPad/i.test(userAgent) ? 'Tablet' : 'Mobile';
    }

    return {
      browser: browserMatch
        ? `${browserMatch[1]} ${browserMatch[2]}`
        : 'Unknown',
      os: osMatch ? osMatch[1].replace('NT', '').trim() : 'Unknown',
      device,
    };
  }

  /**
   * Create initial admin user (for seeding)
   */
  async createInitialAdmin(
    email: string,
    password: string,
    name: string,
  ): Promise<AdminUser> {
    const existingAdmin = await this.adminUserModel
      .findOne({ email: email.toLowerCase() })
      .exec();

    if (existingAdmin) {
      throw new BadRequestException('Admin with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new this.adminUserModel({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: 'super_admin',
    });

    return admin.save();
  }

  /**
   * Get admin by ID (for internal use)
   */
  async getAdminById(adminId: Types.ObjectId): Promise<AdminUser | null> {
    return this.adminUserModel.findById(adminId).exec();
  }
}
