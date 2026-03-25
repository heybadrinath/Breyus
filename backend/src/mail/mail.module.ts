import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { RedisProvider } from './redis.provider';

@Module({
  providers: [RedisProvider, MailService],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}
