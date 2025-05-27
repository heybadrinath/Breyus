import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'analytics_sales' }) // Matching the SQL table name
export class AnalyticsSale {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'text' })
  seller_id: string;

  @Index()
  @Column({ type: 'date' })
  sale_date: string; // Dates are stored as strings in SQLite

  @Column({ type: 'datetime' })
  sale_time: string; // Changed from Date to string to match time-only format like '10:05:00'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  product_name: string;

  @Column({ type: 'integer', nullable: true })
  customer_id: number;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method: string; // 'cash', 'card', 'online'

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
} 