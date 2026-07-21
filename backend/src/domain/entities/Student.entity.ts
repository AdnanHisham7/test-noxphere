export interface MedicalInfo {
  bloodGroup?: string;
  allergies?: string[];
  medicalConditions?: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface GuardianInfo {
  name: string;
  phone: string;
  email: string;
}

export type SelectionStatus =
  | "pending"
  | "shortlisted"
  | "on_hold"
  | "selected"
  | "not_selected"
  | "released";
export type TransferStatus = "not_listed" | "listed" | "sold";

export interface StudentEntity {
  id: string;
  userId: string;
  franchiseId: string;
  teamId?: string;
  coachId?: string;
  guardianIds: string[]; // additional guardian users (if any)
  guardian: GuardianInfo; // primary guardian contact
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  ageGroup: string;
  jerseyNumber?: number;
  jerseySize?: string;
  position?: string;
  photo?: string;
  medicalInfo: MedicalInfo;
  enrollmentDate: Date;
  isActive: boolean;
  attendancePercentage: number;
  overallRating: number;
  selectionStatus: SelectionStatus;
  selectionPhase?: string;
  selectionFeedback?: string;
  transferStatus: TransferStatus;
  transferPrice?: number;
  transferListedAt?: Date;
  transferNote?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
