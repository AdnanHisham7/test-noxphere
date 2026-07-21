// src/domain/entities/User.entity.ts
export type UserRole = 'super_admin' | 'manager' | 'coach' | 'student' | 'guardian';

export interface UserPermissions {
  canManageUsers: boolean;
  canManageFranchises: boolean;
  canManageSessions: boolean;
  canManageFinance: boolean;
  canViewReports: boolean;
  canManageAttendance: boolean;
  canManagePerformance: boolean;
  canManageSelection: boolean;
  canSendNotifications: boolean;
}

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  permissions: UserPermissions;
  fcmTokens: string[];
  franchiseId?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export const defaultPermissions: Record<UserRole, UserPermissions> = {
  super_admin: {
    canManageUsers: true,
    canManageFranchises: true,
    canManageSessions: true,
    canManageFinance: true,
    canViewReports: true,
    canManageAttendance: true,
    canManagePerformance: true,
    canManageSelection: true,
    canSendNotifications: true,
  },
  manager: {
    canManageUsers: true,
    canManageFranchises: true,
    canManageSessions: true,
    canManageFinance: true,
    canViewReports: true,
    canManageAttendance: true,
    canManagePerformance: true,
    canManageSelection: true,
    canSendNotifications: true,
  },
  coach: {
    canManageUsers: false,
    canManageFranchises: false,
    canManageSessions: true,
    canManageFinance: false,
    canViewReports: false,
    canManageAttendance: true,
    canManagePerformance: true,
    canManageSelection: true,
    canSendNotifications: false,
  },
  student: {
    canManageUsers: false,
    canManageFranchises: false,
    canManageSessions: false,
    canManageFinance: false,
    canViewReports: false,
    canManageAttendance: false,
    canManagePerformance: false,
    canManageSelection: false,
    canSendNotifications: false,
  },
  guardian: {
    canManageUsers: false,
    canManageFranchises: false,
    canManageSessions: false,
    canManageFinance: false,
    canViewReports: false,
    canManageAttendance: false,
    canManagePerformance: false,
    canManageSelection: false,
    canSendNotifications: false,
  },
};