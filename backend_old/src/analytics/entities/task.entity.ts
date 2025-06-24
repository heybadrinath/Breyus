import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'text' })
  seller_id: string;

  @Column({ type: 'varchar', length: 255 })
  task_name: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  task_type: string; // 'order_processing', 'inventory', 'customer_service', 'marketing'

  @Index()
  @Column({ type: 'varchar', length: 50 })
  status: string; // 'pending', 'in_progress', 'completed', 'cancelled'

  @Index()
  @Column({ type: 'date' })
  assigned_date: string; // Dates are stored as strings in SQLite

  @Index()
  @Column({ type: 'date', nullable: true })
  due_date: string;

  @Column({ type: 'datetime', nullable: true })
  completed_date: Date;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  priority: string; // 'low', 'medium', 'high'

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
} 