// src/application/dtos/franchise.dto.ts
import { z } from "zod";

const LocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  fieldNumber: z.string().optional(),
});

export const CreateFranchiseSchema = z.object({
  academyId: z.string().min(1),
  name: z.string().min(1),
  managerId: z.string().optional(),
  location: LocationSchema,
  ageGroups: z.array(z.string()).default([]),
  maxStudents: z.number().min(1).default(100),
  alertBeforeMinutes: z.number().min(0).default(60),
  notificationAlertAfterMinutes: z.number().min(0).default(15),
  skillParameters: z.array(z.string()).optional(),
});

export const UpdateFranchiseSchema = z.object({
  name: z.string().min(1).optional(),
  managerId: z.string().optional(),
  location: LocationSchema.partial().optional(),
  ageGroups: z.array(z.string()).optional(),
  maxStudents: z.number().min(1).optional(),
  alertBeforeMinutes: z.number().min(0).optional(),
  notificationAlertAfterMinutes: z.number().min(0).optional(),
  skillParameters: z.array(z.string()).optional(),
});

export type CreateFranchiseDto = z.infer<typeof CreateFranchiseSchema>;
export type UpdateFranchiseDto = z.infer<typeof UpdateFranchiseSchema>;
