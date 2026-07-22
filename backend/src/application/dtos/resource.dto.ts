// src/application/dtos/resource.dto.ts
import { z } from "zod";

export const UploadResourceSchema = z.object({
  franchiseId: z.string().min(1),
});

export type UploadResourceDto = z.infer<typeof UploadResourceSchema>;