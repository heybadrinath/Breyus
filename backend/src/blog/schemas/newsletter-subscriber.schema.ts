import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as crypto from 'crypto';

export type NewsletterSubscriberDocument = NewsletterSubscriber & Document;

export enum SubscriptionSource {
  BLOG_FOOTER = 'blog_footer',
  BLOG_HOMEPAGE = 'blog_homepage',
  BLOG_POST = 'blog_post',
  BLOG_SETTINGS = 'blog_settings',
}

@Schema({ timestamps: true })
export class NewsletterSubscriber {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ default: () => new Date() })
  subscribedAt: Date;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex'),
    index: true,
  })
  unsubscribeToken: string;

  @Prop({
    type: String,
    enum: Object.values(SubscriptionSource),
    default: SubscriptionSource.BLOG_HOMEPAGE,
  })
  source: SubscriptionSource;

  @Prop({ type: Date, default: null })
  lastDigestSentAt: Date | null;
}

export const NewsletterSubscriberSchema =
  SchemaFactory.createForClass(NewsletterSubscriber);
