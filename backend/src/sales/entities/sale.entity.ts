import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'integer', default: 0 })
  totalSales: number;

  @Column({ type: 'integer', default: 0 })
  totalCustomers: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageRevenue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salesIncrease: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  customersIncrease: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  revenueIncrease: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageRevenueIncrease: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ name: 'seller_id' })
  sellerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 