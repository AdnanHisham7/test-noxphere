// src/domain/repositories/IUserRepository.ts
import { UserEntity, UserRole } from '../entities/User.entity';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByEmailWithPassword(email: string): Promise<UserEntity | null>;
  findByIdWithPassword(id: string): Promise<UserEntity | null>;
  findByRole(role: UserRole, franchiseId?: string, options?: PaginationOptions): Promise<PaginatedResult<UserEntity>>;
  searchUsers(filters: {
    roles?: UserRole[];
    franchiseId?: string;
    isActive?: boolean;
    search?: string;
  }, options?: PaginationOptions): Promise<PaginatedResult<UserEntity>>;
  create(user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
  update(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null>;
  softDelete(id: string): Promise<boolean>;
  addFcmToken(userId: string, token: string): Promise<void>;
  removeFcmToken(userId: string, token: string): Promise<void>;
  bulkCreate(users: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<UserEntity[]>;
}

// src/domain/repositories/IStudentRepository.ts
import { StudentEntity, SelectionStatus } from '../entities/Student.entity';

export interface StudentFilters {
  franchiseId?: string;
  teamId?: string;
  coachId?: string;
  ageGroup?: string;
  selectionStatus?: SelectionStatus;
  transferStatus?: string;
  search?: string;
}

export interface IStudentRepository {
  findById(id: string): Promise<StudentEntity | null>;
  findByUserId(userId: string): Promise<StudentEntity | null>;
  findByFranchiseId(franchiseId: string, filters?: StudentFilters, options?: PaginationOptions): Promise<PaginatedResult<StudentEntity>>;
  findByTeamId(teamId: string): Promise<StudentEntity[]>;
  findByGuardianId(guardianId: string): Promise<StudentEntity[]>;
  create(student: Omit<StudentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentEntity>;
  update(id: string, updates: Partial<StudentEntity>): Promise<StudentEntity | null>;
  softDelete(id: string): Promise<boolean>;
  updateAttendancePercentage(studentId: string): Promise<void>;
  updateOverallRating(studentId: string): Promise<void>;
  findTransferListed(franchiseId?: string): Promise<StudentEntity[]>;
}

// src/domain/repositories/IAttendanceRepository.ts
import { AttendanceEntity, AttendanceStatus } from '../entities/Franchise.entity';

export interface AttendanceFilters {
  studentId?: string;
  franchiseId?: string;
  teamId?: string;
  coachId?: string;
  status?: AttendanceStatus;
  fromDate?: Date;
  toDate?: Date;
}

export interface AttendanceSummary {
  studentId: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

export interface IAttendanceRepository {
  findById(id: string): Promise<AttendanceEntity | null>;
  findByFilters(filters: AttendanceFilters, options?: PaginationOptions): Promise<PaginatedResult<AttendanceEntity>>;
  findTodayByTeam(teamId: string, date: Date): Promise<AttendanceEntity[]>;
  create(attendance: Omit<AttendanceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AttendanceEntity>;
  createBulk(attendances: Omit<AttendanceEntity, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<AttendanceEntity[]>;
  update(id: string, updates: Partial<AttendanceEntity>): Promise<AttendanceEntity | null>;
  getSummaryByStudent(studentId: string, franchiseId: string): Promise<AttendanceSummary>;
  getSummaryByTeam(teamId: string, fromDate: Date, toDate: Date): Promise<AttendanceSummary[]>;
}

// src/domain/repositories/IPerformanceRepository.ts
import { PerformanceEntity } from '../entities/Franchise.entity';

export interface PerformanceFilters {
  studentId?: string;
  franchiseId?: string;
  teamId?: string;
  coachId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface IPerformanceRepository {
  findById(id: string): Promise<PerformanceEntity | null>;
  findByFilters(filters: PerformanceFilters, options?: PaginationOptions): Promise<PaginatedResult<PerformanceEntity>>;
  findByStudentId(studentId: string, franchiseId?: string): Promise<PerformanceEntity[]>;
  create(performance: Omit<PerformanceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceEntity>;
  createBulk(performances: Omit<PerformanceEntity, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<PerformanceEntity[]>;
  update(id: string, updates: Partial<PerformanceEntity>): Promise<PerformanceEntity | null>;
  getAveragesByStudent(studentId: string, franchiseId: string): Promise<Record<string, number>>;
}
