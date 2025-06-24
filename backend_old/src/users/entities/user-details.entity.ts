import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_details')
export class UserDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  // Contact Information
  @Column({ nullable: true })
  contactNumber: string;

  @Column({ nullable: true })
  alternateNumber1: string;

  @Column({ nullable: true })
  alternateNumber2: string;

  @Column({ nullable: true })
  alternateEmail: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  //Address information
  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  fullAddress: string;

  // Company Information
  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  companyWebsite: string;

  @Column({ nullable: true })
  gstin: string;

  @Column({ nullable: true })
  companyAddress: string;

  @Column({ nullable: true })
  socials: string;

  // Bank Details
  @Column({ nullable: true })
  accountType: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  ifscCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 