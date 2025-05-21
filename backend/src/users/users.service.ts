import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserDetails } from './entities/user-details.entity';
import { UserDetailsDto } from './dto/user-details.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserDetails)
    private userDetailsRepository: Repository<UserDetails>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password') // This is needed because password is marked as select: false
      .getOne();
  }

  async create(userData: Partial<User>): Promise<User> {
    try {
      // Check if user with this email already exists
      if (userData.email) {
        const existingUser = await this.findByEmail(userData.email);
        if (existingUser) {
          this.logger.warn(`Attempted to create user with existing email: ${userData.email}`);
          throw new ConflictException('Email already exists');
        }
      }
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await this.hashPassword(userData.password);
      }
      
      const newUser = this.usersRepository.create(userData);
      const savedUser = await this.usersRepository.save(newUser);
      
      this.logger.log(`User created successfully: ${userData.email}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      
      // Rethrow the error to be handled by the calling service
      throw error;
    }
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await this.hashPassword(updateData.password);
    }
    
    await this.usersRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    await this.usersRepository.update(userId, { password: hashedPassword });
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmailWithPassword(email);
    
    if (!user || !user.password) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return user;
  }

  async findUserDetailsById(userId: string): Promise<UserDetails> {
    try {
      // First, check if user exists
      const user = await this.findOne(userId);
      
      // Then, try to find user details
      let userDetails = await this.userDetailsRepository.findOne({
        where: { userId }
      });
      
      // If user details don't exist, create an empty record
      if (!userDetails) {
        userDetails = this.userDetailsRepository.create({
          userId,
          // Initialize with default empty values
          country: 'Enter your country'
        });
        await this.userDetailsRepository.save(userDetails);
      }
      
      return userDetails;
    } catch (error) {
      this.logger.error(`Error finding user details: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateUserDetails(userId: string, userDetailsDto: UserDetailsDto): Promise<UserDetails> {
    try {
      // First, check if user exists
      await this.findOne(userId);
      
      // Find existing user details or create new ones
      let userDetails = await this.userDetailsRepository.findOne({
        where: { userId }
      });
      
      if (!userDetails) {
        userDetails = this.userDetailsRepository.create({
          userId,
          ...userDetailsDto
        });
      } else {
        // Update existing details
        this.userDetailsRepository.merge(userDetails, userDetailsDto);
      }
      
      return this.userDetailsRepository.save(userDetails);
    } catch (error) {
      this.logger.error(`Error updating user details: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserWithDetails(userId: string): Promise<any> {
    try {
      const user = await this.findOne(userId);
      const userDetails = await this.findUserDetailsById(userId);
      
      return {
        ...user,
        details: userDetails
      };
    } catch (error) {
      this.logger.error(`Error getting user with details: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOneWithPassword(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .addSelect('user.password') // This is needed because password is marked as select: false
      .getOne();
  }
} 