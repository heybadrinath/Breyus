import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class PieChart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  seller_id: string;

  @Column()
  category: string;

  @Column()
  value: number;
}
