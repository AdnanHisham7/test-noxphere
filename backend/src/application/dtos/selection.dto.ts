// src/application/dtos/selection.dto.ts
import { z } from "zod";

export const UpdateSelectionStatusSchema = z.object({
  status: z.enum(["pending", "shortlisted", "on_hold", "selected", "not_selected", "released"]),
  feedback: z.string().optional(),
  phase: z.string().optional(),
});

export const NotifySelectionSchema = z.object({
  franchiseId: z.string().min(1),
  phase: z.string().optional(),
  message: z.string().min(1).default("Your selection status has been updated. Check your dashboard for details."),
});

export type UpdateSelectionStatusDto = z.infer<typeof UpdateSelectionStatusSchema>;
export type NotifySelectionDto = z.infer<typeof NotifySelectionSchema>;
