import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ScatterGraph {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  seller_id: string;

  @Column()
  day: string;

  @Column()
  x: number;

  @Column()
  y: number;
}
