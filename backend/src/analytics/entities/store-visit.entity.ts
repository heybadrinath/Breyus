import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'store_visits' })
export class StoreVisit {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'text' })
  seller_id: string;

  @Index()
  @Column({ type: 'date' })
  visit_date: string; // Dates are stored as strings in SQLite

  @Column({ type: 'datetime' })
  visit_time: string; // Changed from Date to string to match time format like '10:00:00'

  @Column({ type: 'integer', default: 1 })
  visitor_count: number;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  source: string; // 'web', 'mobile', 'direct'

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
} 