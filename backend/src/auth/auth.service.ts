import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/user.schema';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  // Generate JWT token for a given user
  async generateJwtToken(user: User): Promise<string> {
    const payload = { email: user.mail, role: user.role, sub: user._id };
    return this.jwtService.sign(payload); 
  }
}
