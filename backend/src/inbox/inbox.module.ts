import { Module } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { InboxController } from './inbox.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Inbox, InboxSchema } from './inbox.schema';
import { Product, ProductSchema } from 'src/products/schema/products.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{name: Inbox.name, schema: InboxSchema}]),
        MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  providers: [InboxService],
  controllers: [InboxController]
})
export class InboxModule {}
