// src/infrastructure/database/models/Session.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface SessionDocument extends Document {
  franchiseId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  coachId: mongoose.Types.ObjectId;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  fieldNumber?: string;
  status: string;
  notes?: string;
  cancelReason?: string;
  createdBy: mongoose.Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<SessionDocument>(
  {
    franchiseId: { type: Schema.Types.ObjectId, ref: "Franchise", required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    coachId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["training", "match", "trial", "fitness"],
      default: "training",
    },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    location: { type: String, required: true },
    fieldNumber: String,
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
      index: true,
    },
    notes: String,
    cancelReason: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

SessionSchema.pre(/^find/, function (this: mongoose.Query<unknown, SessionDocument>, next) {
  this.where({ deletedAt: { $exists: false } });
  next();
});

SessionSchema.index({ franchiseId: 1, date: 1 });
SessionSchema.index({ teamId: 1, date: 1 });

export const SessionModel = mongoose.model<SessionDocument>("Session", SessionSchema);
