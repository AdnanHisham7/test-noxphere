// src/infrastructure/database/models/Franchise.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface FranchiseDocument extends Document {
  academyId: mongoose.Types.ObjectId;
  name: string;
  franchiseCode: string;
  managerId?: mongoose.Types.ObjectId;
  location: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    fieldNumber?: string;
  };
  sessionTimes: { dayOfWeek: number; startTime: string; endTime: string }[];
  ageGroups: string[];
  skillLevels: string[];
  maxStudents: number;
  isActive: boolean;
  alertBeforeMinutes: number;
  notificationAlertAfterMinutes: number;
  skillParameters: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FranchiseSchema = new Schema<FranchiseDocument>(
  {
    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', required: true, index: true },
    name: { type: String, required: true, trim: true },
    franchiseCode: { type: String, unique: true, index: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    location: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      fieldNumber: String,
    },
    sessionTimes: [{
      dayOfWeek: { type: Number, min: 0, max: 6 },
      startTime: String,
      endTime: String,
      _id: false,
    }],
    ageGroups: [String],
    skillLevels: [String],
    maxStudents: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true, index: true },
    alertBeforeMinutes: { type: Number, default: 60 },
    notificationAlertAfterMinutes: { type: Number, default: 15 },
    skillParameters: {
      type: [String],
      default: ['Dribbling', 'Passing', 'Shooting', 'Speed', 'Tactical Awareness', 'Attitude'],
    },
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
  }
);

FranchiseSchema.pre(/^find/, function (this: mongoose.Query<unknown, FranchiseDocument>, next) {
  this.where({ deletedAt: { $exists: false } });
  next();
});

FranchiseSchema.index({ academyId: 1, isActive: 1 });

export const FranchiseModel = mongoose.model<FranchiseDocument>('Franchise', FranchiseSchema);
