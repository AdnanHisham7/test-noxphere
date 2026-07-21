// src/infrastructure/database/models/Student.model.ts
import mongoose, { Schema, Document } from "mongoose";
import { StudentEntity } from "../../../domain/entities/Student.entity";

export interface StudentDocument extends Document {
  userId: mongoose.Types.ObjectId;
  franchiseId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  coachId?: mongoose.Types.ObjectId;
  guardianIds: mongoose.Types.ObjectId[];
  guardian: StudentEntity["guardian"];
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  ageGroup: string;
  jerseyNumber?: number;
  jerseySize?: string;
  position?: string;
  photo?: string;
  medicalInfo: StudentEntity["medicalInfo"];
  enrollmentDate: Date;
  isActive: boolean;
  attendancePercentage: number;
  overallRating: number;
  selectionStatus: StudentEntity["selectionStatus"];
  selectionPhase?: string;
  selectionFeedback?: string;
  transferStatus: StudentEntity["transferStatus"];
  transferPrice?: number;
  transferListedAt?: Date;
  transferNote?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const MedicalInfoSchema = new Schema(
  {
    bloodGroup: String,
    allergies: [String],
    medicalConditions: [String],
    emergencyContactName: { type: String, required: true },
    emergencyContactPhone: { type: String, required: true },
  },
  { _id: false },
);

const GuardianSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
  },
  { _id: false },
);

const StudentSchema = new Schema<StudentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    franchiseId: {
      type: Schema.Types.ObjectId,
      ref: "Franchise",
      required: true,
      index: true,
    },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    coachId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    guardianIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    ageGroup: { type: String, required: true, index: true },
    jerseyNumber: Number,
    jerseySize: String,
    position: String,
    photo: String,
    medicalInfo: { type: MedicalInfoSchema, required: true },
    enrollmentDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true, index: true },
    attendancePercentage: { type: Number, default: 0, min: 0, max: 100 },
    overallRating: { type: Number, default: 0, min: 0, max: 10 },
    selectionStatus: {
      type: String,
      enum: [
        "pending",
        "shortlisted",
        "on_hold",
        "selected",
        "not_selected",
        "released",
      ],
      default: "pending",
      index: true,
    },
    selectionPhase: String,
    selectionFeedback: String,
    transferStatus: {
      type: String,
      enum: ["not_listed", "listed", "sold"],
      default: "not_listed",
      index: true,
    },
    guardian: { type: GuardianSchema, required: true },
    transferPrice: Number,
    transferListedAt: Date,
    transferNote: String,
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        const { _id, __v, ...rest } = ret;

        rest.id = _id.toString();

        return rest;
      },
    },
  },
);

StudentSchema.pre(
  /^find/,
  function (this: mongoose.Query<unknown, StudentDocument>, next) {
    this.where({ deletedAt: { $exists: false } });
    next();
  },
);

StudentSchema.index({ franchiseId: 1, ageGroup: 1, isActive: 1 });
StudentSchema.index({ franchiseId: 1, transferStatus: 1 });
StudentSchema.index({ firstName: "text", lastName: "text" });

export const StudentModel = mongoose.model<StudentDocument>(
  "Student",
  StudentSchema,
);
