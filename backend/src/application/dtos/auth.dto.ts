// src/application/dtos/auth.dto.ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['manager', 'coach', 'student', 'guardian']),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  franchiseId: z.string().optional(),
  fcmToken: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  fcmToken: z.string().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

// src/application/dtos/student.dto.ts
export const CreateStudentSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: z.string().datetime(),
  ageGroup: z.string().min(1),
  franchiseId: z.string().min(1),
  teamId: z.string().optional(),
  coachId: z.string().optional(),
  guardianIds: z.array(z.string()).default([]),
  jerseyNumber: z.number().min(1).max(99).optional(),
  jerseySize: z.string().optional(),
  position: z.string().optional(),
  medicalInfo: z.object({
    bloodGroup: z.string().optional(),
    allergies: z.array(z.string()).default([]),
    medicalConditions: z.array(z.string()).default([]),
    emergencyContactName: z.string().min(1),
    emergencyContactPhone: z.string().min(1),
  }),
});

export const UpdateStudentSchema = CreateStudentSchema.partial().omit({ email: true, franchiseId: true });

export type CreateStudentDto = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentDto = z.infer<typeof UpdateStudentSchema>;

// src/application/dtos/attendance.dto.ts
export const MarkAttendanceSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  remarks: z.string().optional(),
  isOfflineEntry: z.boolean().default(false),
});

export const BulkAttendanceSchema = z.object({
  teamId: z.string().min(1),
  franchiseId: z.string().min(1),
  sessionDate: z.string().datetime(),
  entries: z.array(MarkAttendanceSchema),
});

export type MarkAttendanceDto = z.infer<typeof MarkAttendanceSchema>;
export type BulkAttendanceDto = z.infer<typeof BulkAttendanceSchema>;

// src/application/dtos/performance.dto.ts
export const SkillScoreSchema = z.object({
  parameter: z.string().min(1),
  score: z.number().min(1).max(10),
});

export const CreatePerformanceSchema = z.object({
  studentId: z.string().min(1),
  franchiseId: z.string().min(1),
  teamId: z.string().min(1),
  sessionDate: z.string().datetime(),
  skillScores: z.array(SkillScoreSchema).min(1),
  remarks: z.string().optional(),
  videoUrl: z.string().url().optional(),
  isOfflineEntry: z.boolean().default(false),
});

export const BulkPerformanceSchema = z.object({
  franchiseId: z.string().min(1),
  teamId: z.string().min(1),
  sessionDate: z.string().datetime(),
  performances: z.array(CreatePerformanceSchema.omit({ franchiseId: true, teamId: true, sessionDate: true })),
});

export type CreatePerformanceDto = z.infer<typeof CreatePerformanceSchema>;
export type BulkPerformanceDto = z.infer<typeof BulkPerformanceSchema>;

// Transfer Wall DTOs
export const ListTransferSchema = z.object({
  price: z.number().min(0),
  currency: z.string().default('INR'),
  note: z.string().optional(),
  skills: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});

export const TransferRequestSchema = z.object({
  listingId: z.string().min(1),
  toFranchiseId: z.string().min(1),
  offeredPrice: z.number().min(0),
  message: z.string().optional(),
});

export type ListTransferDto = z.infer<typeof ListTransferSchema>;
export type TransferRequestDto = z.infer<typeof TransferRequestSchema>;
