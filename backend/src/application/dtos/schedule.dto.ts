// src/application/dtos/schedule.dto.ts
import { z } from "zod";

const SessionBaseSchema = z.object({
  franchiseId: z.string().min(1),
  // A session is scheduled either for one specific team, or for every
  // student in an age-group category across the franchise (including
  // students who aren't on any team yet). Exactly one of teamId/category
  // is required, enforced by the refinement on CreateSessionSchema below.
  targetType: z.enum(["team", "category"]).default("team"),
  teamId: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  // Optional here: a coach scheduling their own session never sends this —
  // the controller always overrides it with the logged-in coach's id. A
  // manager/super_admin must supply it; that's enforced in the use-case,
  // not here, since it depends on who's making the request.
  coachId: z.string().min(1).optional(),
  type: z.enum(["training", "match", "trial", "fitness"]).default("training"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "endTime must be HH:MM"),
  location: z.string().min(1),
  fieldNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateSessionSchema = SessionBaseSchema.refine(
  (data) => (data.targetType === "team" ? !!data.teamId : !!data.category),
  {
    message: "Select a team for a team session, or a category for a category session",
    path: ["teamId"],
  },
);

export const UpdateSessionSchema = SessionBaseSchema.partial().extend({
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).optional(),
});

export const ChangeLocationSchema = z.object({
  location: z.string().min(1),
  fieldNumber: z.string().optional(),
  notifyGuardians: z.boolean().default(true),
});

export const CancelSessionSchema = z.object({
  reason: z.string().min(1),
});

export const MarkAttendanceRecordSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["present", "absent", "late", "excused"]),
  remarks: z.string().optional(),
});

export const MarkSessionAttendanceSchema = z.object({
  records: z.array(MarkAttendanceRecordSchema).min(1),
});

export const SkillScoreSchema = z.object({
  parameter: z.string().min(1),
  score: z.number().min(0).max(10),
});

export const LogPerformanceRecordSchema = z.object({
  studentId: z.string().min(1),
  skillScores: z.array(SkillScoreSchema).min(1),
  remarks: z.string().optional(),
  videoUrl: z.string().optional(),
});

export const LogSessionPerformanceSchema = z.object({
  records: z.array(LogPerformanceRecordSchema).min(1),
});

export type MarkSessionAttendanceDto = z.infer<typeof MarkSessionAttendanceSchema>;
export type LogSessionPerformanceDto = z.infer<typeof LogSessionPerformanceSchema>;
export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionDto = z.infer<typeof UpdateSessionSchema>;
export type ChangeLocationDto = z.infer<typeof ChangeLocationSchema>;
export type CancelSessionDto = z.infer<typeof CancelSessionSchema>;