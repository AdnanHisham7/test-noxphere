// src/application/use-cases/auth/AuthUseCases.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserEntity, UserRole, defaultPermissions } from '../../../domain/entities/User.entity';
import { AppError, UnauthorizedError, ConflictError, NotFoundError } from '../../../shared/errors/AppError';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../../dtos/auth.dto';
import { config } from '../../../config/app.config';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: Omit<UserEntity, 'passwordHash'>;
  tokens: AuthTokens;
}

export class AuthUseCases {
  constructor(private readonly userRepository: IUserRepository) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      role: dto.role,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      permissions: defaultPermissions[dto.role as UserRole],
      isActive: true,
      isEmailVerified: false,
      fcmTokens: [],
      franchiseId: dto.franchiseId,
    });

    const tokens = this.generateTokens(user);
    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    console.log('Attempting login for email:', dto.email);
    const user = await this.userRepository.findByEmail(dto.email);
    console.log('User found during login:', user);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }
    
    // Need to explicitly select passwordHash since it's excluded by default
    const userWithPassword = await this.userRepository.findByEmailWithPassword(dto.email);
    if (!userWithPassword) throw new UnauthorizedError('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(dto.password, userWithPassword.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });
    
    if (dto.fcmToken) {
      await this.userRepository.addFcmToken(user.id, dto.fcmToken);
    }
    
    const tokens = this.generateTokens(user);
    console.log('Tokens generated during login:', tokens);
    return { user, tokens };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(dto.refreshToken, config.jwt.refreshSecret) as { sub: string };
      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, fcmToken?: string): Promise<void> {
    if (fcmToken) {
      await this.userRepository.removeFcmToken(userId, fcmToken);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user) throw new NotFoundError('User');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(userId, { passwordHash } as Partial<UserEntity>);
  }

  private generateTokens(user: UserEntity): AuthTokens {
    const payload = {
      sub: user.id,
      role: user.role,
      franchiseId: user.franchiseId,
      permissions: user.permissions,
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    });

    const refreshToken = jwt.sign({ sub: user.id }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }
}
