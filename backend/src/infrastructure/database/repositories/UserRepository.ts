// src/infrastructure/database/repositories/UserRepository.ts
import { IUserRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories/IUserRepository';
import { UserEntity, UserRole } from '../../../domain/entities/User.entity';
import { UserModel, UserDocument } from '../models/User.model';

export class MongoUserRepository implements IUserRepository {
  private toEntity(doc: UserDocument): UserEntity {
    return {
      id: doc.id,
      email: doc.email,
      passwordHash: doc.passwordHash,
      role: doc.role as UserRole,
      firstName: doc.firstName,
      lastName: doc.lastName,
      phone: doc.phone,
      avatar: doc.avatar,
      isActive: doc.isActive,
      isEmailVerified: doc.isEmailVerified,
      permissions: doc.permissions,
      fcmTokens: doc.fcmTokens,
      franchiseId: doc.franchiseId?.toString(),
      lastLoginAt: doc.lastLoginAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      deletedAt: doc.deletedAt,
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await UserModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByIdWithPassword(id: string): Promise<UserEntity | null> {
    const doc = await UserModel.findById(id).select('+passwordHash');
    return doc ? this.toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() });
    return doc ? this.toEntity(doc) : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    return doc ? this.toEntity(doc) : null;
  }

  async findByRole(
    role: UserRole,
    franchiseId?: string,
    options: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<UserEntity>> {
    const query: Record<string, unknown> = { role, isActive: true };
    if (franchiseId) query.franchiseId = franchiseId;

    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      UserModel.find(query).skip(skip).limit(options.limit).sort({ createdAt: -1 }),
      UserModel.countDocuments(query),
    ]);

    return {
      data: docs.map((d) => this.toEntity(d)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async searchUsers(
    filters: { roles?: UserRole[]; franchiseId?: string; isActive?: boolean; search?: string },
    options: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<UserEntity>> {
    const query: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (filters.roles && filters.roles.length > 0) query.role = { $in: filters.roles };
    if (filters.franchiseId) query.franchiseId = filters.franchiseId;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      UserModel.find(query).skip(skip).limit(options.limit).sort({ createdAt: -1 }),
      UserModel.countDocuments(query),
    ]);

    return {
      data: docs.map((d) => this.toEntity(d)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async create(user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const doc = await UserModel.create(user);
    return this.toEntity(doc);
  }

  async update(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    const doc = await UserModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    return doc ? this.toEntity(doc) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndUpdate(id, {
      deletedAt: new Date(),
      isActive: false,
    });
    return result !== null;
  }

  async addFcmToken(userId: string, token: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: token },
    });
  }

  async removeFcmToken(userId: string, token: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: token },
    });
  }

  async bulkCreate(users: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<UserEntity[]> {
    const docs = await UserModel.insertMany(users, { ordered: false });
    return docs.map((d) => this.toEntity(d as unknown as UserDocument));
  }
}
