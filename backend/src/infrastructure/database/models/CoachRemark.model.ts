import mongoose, { Schema, Document } from "mongoose";

export interface CoachRemarkDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  coachId: mongoose.Types.ObjectId;
  date: Date;
  text: string;
}

const CoachRemarkSchema = new Schema<CoachRemarkDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    coachId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    text: { type: String, required: true },
  },
  { timestamps: true },
);

export const CoachRemarkModel = mongoose.model<CoachRemarkDocument>(
  "CoachRemark",
  CoachRemarkSchema,
);
