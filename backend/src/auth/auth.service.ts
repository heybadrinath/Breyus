import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) { }

  // onboarding jwt token generate
  generateOnboardingToken({ mail, userId }: { mail?: string, userId?: string }): string {

    let payload: any = {}
    if (mail) {
      payload.mail = mail
    }

    if (userId) {
      payload.userId = userId;
    }

    if (!mail && !userId) {
      throw new Error('Either mail or UserId should be provided');

    }

    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      throw new Error('JWT_SECRET_KEY is not defined in environment variables');
    }
    const token = jwt.sign(payload, secretKey, { expiresIn: '15m' });
    return token;
  }

  // verify onboardingToken weather it's mail or userId
  verifyOnboardingToken(token: string): any {
    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      throw new Error("JWT_SECRET_KEY is not defined in the environment variables");
    }
    try { 
      const decoded: any = jwt.verify(token,secretKey);

      if(decoded.userId){
        return {status: "accountExists"};
      }

      if(decoded.mail){ 
        return {status: "createAccount"};
      }else{
        throw new HttpException('Neither userId not mail is defined in the payload!',HttpStatus.BAD_REQUEST);
      }
    } catch(e){
        throw new HttpException('Error verifying token: ' + e,HttpStatus.BAD_REQUEST);
    }
  }
}
