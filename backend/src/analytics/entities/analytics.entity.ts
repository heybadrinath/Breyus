import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('analytics')
export class Analytics {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text', { nullable: true })
    store_visits: string;

    @Column('text', { nullable: true })
    daily_sales: string;

    @Column({ type: 'integer', default: 0 })
    website_views: number;

    @Column({ type: 'integer', default: 0 })
    website_views_increase: number;

    @Column({ type: 'integer', default: 0 })
    today_users: number;

    @Column({ type: 'integer', default: 0 })
    today_users_increase: number;

    @Column({ type: 'integer', default: 0 })
    revenue: number;

    @Column({ type: 'integer', default: 0 })
    revenue_increase: number;

    @Column({ type: 'integer', default: 0 })
    followers: number;

    @Column({ type: 'integer', default: 0 })
    followers_increase: number;

    @Column('text', { nullable: true })
    country_sales: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
} 