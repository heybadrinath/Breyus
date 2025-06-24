import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Metrics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  websiteViews: number;

  @Column()
  websiteViewsincrease: number;

  @Column()
  todayUsers: number;

  @Column()
  todayUsersincrease: number;

  @Column()
  revenue: number;

  @Column()
  revenueincrease: number;

  @Column()
  followers: number;

  @Column()
  followersincrease: number;
}
