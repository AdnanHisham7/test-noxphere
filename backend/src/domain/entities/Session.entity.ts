// src/domain/entities/Session.entity.ts
export type SessionType = "training" | "match" | "trial" | "fitness";
export type SessionStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface SessionEntity {
  id: string;
  franchiseId: string;
  teamId: string;
  coachId: string;
  type: SessionType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  fieldNumber?: string;
  status: SessionStatus;
  notes?: string;
  cancelReason?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
