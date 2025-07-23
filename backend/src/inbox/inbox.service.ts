import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inbox } from './inbox.schema';
import { CreateMessageDto } from './inbox.dto';
import { Product } from 'src/products/schema/products.schema';

@Injectable()
export class InboxService {
  constructor(
    @InjectModel(Inbox.name) private messageModel: Model<Inbox>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async createMessage(senderId: string, createMessageDto: CreateMessageDto) {
    const product = await this.productModel.findById(createMessageDto.product);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const recipient = product;  

    // Create a new message using the sender (from JWT) and the recipient (from the product)
    const newMessage = new this.messageModel({
      sender: senderId,  // Sender is from JWT token (provided in controller)
      recipient,         // Recipient is derived from the product
      ...createMessageDto,
    });

    return await newMessage.save();  // Save the new message to the database
  }
}
