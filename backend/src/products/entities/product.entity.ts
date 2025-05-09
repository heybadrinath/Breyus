import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  moq: string;

  @Column({ type: 'text', nullable: true })
  preciseDescription: string;

  @Column({ type: 'text', nullable: true })
  detailedDescription: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  hsnCode: string;

  @Column({ nullable: true })
  productImage: string;

  @Column({ nullable: true })
  testReports: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ nullable: true })
  sku: string;

  @Column({ default: false })
  onSale: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costOfGoods: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  profit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  margin: number;

  @Column({ nullable: true, type: 'simple-array' })
  tags: string[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ name: 'seller_id', nullable: true })
  sellerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 