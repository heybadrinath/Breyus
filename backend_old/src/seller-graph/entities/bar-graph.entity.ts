import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class BarGraph {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  seller_id: string;

  @Column()
  date: string;

  @Column()
  storeVisits: number;

  @Column()
  uniqueVisitors: number;
}
