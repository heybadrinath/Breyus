import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CountrySales {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  seller_id: string;

  @Column()
  country: string;

  @Column()
  flag: string;

  @Column()
  sales: number;

  @Column()
  value: string;

  @Column()
  bounce: string;

  @Column()
  sales_count: number;
}
