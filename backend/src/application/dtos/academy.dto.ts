import { z } from 'zod';

// Manager creation sub‑schema
export const ManagerAccountSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

// Location sub‑schema
export const LocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  fieldNumber: z.string().optional(),
});

// Create Academy DTO (includes manager creation data)
export const CreateAcademySchema = z.object({
  name: z.string().min(1).max(100),
  academyCode: z.string().min(1).max(20).optional(), // will generate if omitted
  location: LocationSchema,
  ageGroups: z.array(z.string()).default([]),
  maxStudents: z.number().min(1).default(100),
  alertBeforeMinutes: z.number().min(0).default(60),
  notificationAlertAfterMinutes: z.number().min(0).default(15),
  skillParameters: z.array(z.string()).default(['Dribbling', 'Passing', 'Shooting', 'Speed', 'Tactical Awareness', 'Attitude']),
  manager: ManagerAccountSchema,
});

// Update Academy DTO (partial, without manager)
export const UpdateAcademySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: LocationSchema.partial().optional(),
  ageGroups: z.array(z.string()).optional(),
  maxStudents: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  alertBeforeMinutes: z.number().min(0).optional(),
  notificationAlertAfterMinutes: z.number().min(0).optional(),
  skillParameters: z.array(z.string()).optional(),
});

// Config update (used by frontend configuration modal)
export const AcademyConfigSchema = z.object({
  maxStudents: z.number().min(1).optional(),
  ageGroups: z.array(z.string()).optional(),
  alertBeforeMinutes: z.number().min(0).optional(),
  notificationAlertAfterMinutes: z.number().min(0).optional(),
  skillParameters: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAcademyDto = z.infer<typeof CreateAcademySchema>;
export type UpdateAcademyDto = z.infer<typeof UpdateAcademySchema>;
export type AcademyConfigDto = z.infer<typeof AcademyConfigSchema>;