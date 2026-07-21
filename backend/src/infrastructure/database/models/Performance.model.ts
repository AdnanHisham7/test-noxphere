// src/infrastructure/database/models/Performance.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface PerformanceDocument extends Document {
    studentId: mongoose.Types.ObjectId;
    franchiseId: mongoose.Types.ObjectId;
    teamId?: mongoose.Types.ObjectId;
    coachId?: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    sessionDate: Date;
    skillScores: { parameter: string; score: number }[];
    overallScore: number;
    remarks?: string;
    videoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SkillScoreSchema = new Schema({
  parameter: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 10 },
}, { _id: false });

const PerformanceSchema = new Schema<PerformanceDocument>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  franchiseId: { type: Schema.Types.ObjectId, ref: 'Franchise', required: true, index: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true },
  coachId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  // Performance can only be logged against a real scheduled session — this
  // is what stops scores from being invented for a session that never
  // happened.
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  sessionDate: { type: Date, required: true, index: true },
  skillScores: { type: [SkillScoreSchema], required: true },
  overallScore: { type: Number, required: true, min: 0, max: 10 },
  remarks: String,
  videoUrl: String,
}, { timestamps: true });

// One performance record per student per session.
PerformanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

export const PerformanceModel = mongoose.model<PerformanceDocument>('Performance', PerformanceSchema);
