// src/domain/entities/Franchise.entity.ts
export interface FranchiseLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  fieldNumber?: string;
}

export interface SessionTime {
  dayOfWeek: number; // 0-6, Sunday=0
  startTime: string; // "HH:MM"
  endTime: string;
}

export interface FranchiseEntity {
  id: string;
  academyId: string;
  name: string;
  franchiseCode: string; // unique code for self-registration
  managerId?: string;
  location: FranchiseLocation;
  sessionTimes: SessionTime[];
  ageGroups: string[];
  skillLevels: string[];
  maxStudents: number;
  isActive: boolean;
  alertBeforeMinutes: number; // push notif X mins before session
  notificationAlertAfterMinutes: number; // push notif X mins after session ends
  skillParameters: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// src/domain/entities/Attendance.entity.ts
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceEntity {
  id: string;
  studentId: string;
  franchiseId: string;
  teamId: string;
  coachId: string;
  sessionDate: Date;
  status: AttendanceStatus;
  checkInTime?: Date;
  remarks?: string;
  proofPhotoUrl?: string;
  isOfflineEntry: boolean;
  syncedAt?: Date;
  guardianNotified: boolean;
  manuallyEdited: boolean;
  editedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// src/domain/entities/Performance.entity.ts
export interface SkillScore {
  parameter: string;
  score: number; // 1-10
}

export interface PerformanceEntity {
  id: string;
  studentId: string;
  franchiseId: string;
  teamId: string;
  coachId: string;
  sessionDate: Date;
  skillScores: SkillScore[];
  overallScore: number;
  remarks?: string;
  videoUrl?: string;
  isOfflineEntry: boolean;
  syncedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
