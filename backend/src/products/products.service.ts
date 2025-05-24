import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(sellerId?: string): Promise<Product[]> {
    const query = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller');
    
    if (sellerId) {
      query.where('product.sellerId = :sellerId', { sellerId });
    }
    
    return query.getMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ 
      where: { id },
      relations: ['seller']
    });
    if (!product) {
      this.logger.warn(`Product with ID ${id} not found`);
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(createProductDto: CreateProductDto, sellerId?: string): Promise<Product> {
    this.logger.log(`Creating new product ${sellerId ? 'for seller ' + sellerId : 'without seller'}`);
    const product = this.productsRepository.create({
      ...createProductDto,
      ...(sellerId ? { sellerId } : {})
    });
    return this.productsRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    this.logger.log(`Updating product ${id}`);
    const product = await this.findOne(id);
    
    Object.assign(product, updateProductDto);
    
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing product ${id}`);
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }
} 