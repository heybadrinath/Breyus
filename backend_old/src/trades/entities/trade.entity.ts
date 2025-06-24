import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

export enum TradeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COUNTER_OFFERED = 'counter_offered',
  EXPIRED = 'expired',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TradeType {
  PURCHASE_REQUEST = 'purchase_request',
  BULK_ORDER = 'bulk_order',
  SPOT_TRADE = 'spot_trade',
  CONTRACT_TRADE = 'contract_trade'
}

@Entity('trades')
@Index(['seller_id', 'status', 'created_at'])
@Index(['buyer_id', 'status'])
@Index(['expires_at'])
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_id' })
  @Index()
  buyer_id: string;

  @Column({ name: 'seller_id' })
  @Index()
  seller_id: string;

  @Column({ name: 'product_id' })
  @Index()
  product_id: string;

  @Column({
    type: 'text',
    enum: TradeStatus,
    default: TradeStatus.PENDING
  })
  @Index()
  status: TradeStatus;

  @Column({
    type: 'text',
    enum: TradeType,
    default: TradeType.PURCHASE_REQUEST
  })
  trade_type: TradeType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  offered_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  counter_offer_price: number | null;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  buyer_message: string | null;

  @Column({ type: 'text', nullable: true })
  seller_message: string | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'json', nullable: true })
  trade_terms: Record<string, any> | null;

  @Column({ type: 'json', nullable: true })
  shipping_details: Record<string, any> | null;

  @Column({ type: 'datetime', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  accepted_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  final_price: number | null;

  @Column({ type: 'boolean', default: false })
  is_urgent: boolean;

  @Column({ type: 'integer', default: 0 })
  counter_offer_count: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 