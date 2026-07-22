import { z } from 'zod';

export const GuardianInfoSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
});

export const MedicalInfoSchema = z.object({
  bloodGroup: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  emergencyContactName: z.string().min(1),
  emergencyContactPhone: z.string().min(1),
});

export const CreateStudentSchema = z.object({
  email: z.string().email(),          // guardian email used to create user account
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: z.string().datetime(),
  ageGroup: z.string().min(1),
  franchiseId: z.string().min(1),
  teamId: z.string().optional(),
  coachId: z.string().optional(),
  jerseyNumber: z.number().min(1).max(99).optional(),
  jerseySize: z.string().optional(),
  position: z.string().optional(),
  photo: z.string().url().optional(),
  guardian: GuardianInfoSchema,
  medicalInfo: MedicalInfoSchema,
});

export const UpdateStudentSchema = CreateStudentSchema.omit({ email: true, franchiseId: true }).partial();

export const AddPerformanceSchema = z.object({
  sessionDate: z.string().datetime(),
  skillScores: z.array(z.object({ parameter: z.string(), score: z.number().min(0).max(10) })).min(1),
  remarks: z.string().optional(),
  videoUrl: z.string().url().optional(),
});

export const MarkAttendanceSchema = z.object({
  date: z.string().datetime(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  remarks: z.string().optional(),
});

export const AddCoachRemarkSchema = z.object({
  text: z.string().min(1),
});

export type CreateStudentDto = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentDto = z.infer<typeof UpdateStudentSchema>;
export type AddPerformanceDto = z.infer<typeof AddPerformanceSchema>;
export type MarkAttendanceDto = z.infer<typeof MarkAttendanceSchema>;
export type AddCoachRemarkDto = z.infer<typeof AddCoachRemarkSchema>;