// src/infrastructure/database/models/Attendance.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface AttendanceDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  franchiseId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  coachId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  sessionDate: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: Date;
  remarks?: string;
  proofPhotoUrl?: string;
  isOfflineEntry: boolean;
  syncedAt?: Date;
  guardianNotified: boolean;
  manuallyEdited: boolean;
  editedBy?: mongoose.Types.ObjectId;
  markedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<AttendanceDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    franchiseId: { type: Schema.Types.ObjectId, ref: 'Franchise', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Attendance can only be marked against a real scheduled session — this
    // is what stops it from being marked for an arbitrary/made-up date.
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    sessionDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
      index: true,
    },
    checkInTime: Date,
    remarks: String,
    proofPhotoUrl: String,
    isOfflineEntry: { type: Boolean, default: false },
    syncedAt: Date,
    guardianNotified: { type: Boolean, default: false },
    manuallyEdited: { type: Boolean, default: false },
    editedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AttendanceSchema.index({ studentId: 1, franchiseId: 1, sessionDate: -1 });
AttendanceSchema.index({ teamId: 1, sessionDate: -1 });
AttendanceSchema.index({ franchiseId: 1, sessionDate: -1, status: 1 });

// One attendance record per student per session — this is the constraint
// that keeps marking idempotent (re-marking a session updates, not
// duplicates).
AttendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

export const AttendanceModel = mongoose.model<AttendanceDocument>('Attendance', AttendanceSchema);