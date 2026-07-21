import mongoose, { Schema, Document } from "mongoose";
import {
  AcademyEntity,
  Location,
} from "../../../domain/entities/Academy.entity";

export interface AcademyDocument extends Document {
  name: string;
  academyCode: string;
  managerId: mongoose.Types.ObjectId;
  location: Location;
  ageGroups: string[];
  maxStudents: number;
  isActive: boolean;
  alertBeforeMinutes: number;
  notificationAlertAfterMinutes: number;
  skillParameters: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<Location>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    fieldNumber: { type: String },
  },
  { _id: false },
);

const AcademySchema = new Schema<AcademyDocument>(
  {
    name: { type: String, required: true, trim: true },
    academyCode: { type: String, unique: true, index: true },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    location: { type: LocationSchema, required: true },
    ageGroups: [{ type: String }],
    maxStudents: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true, index: true },
    alertBeforeMinutes: { type: Number, default: 60 },
    notificationAlertAfterMinutes: { type: Number, default: 15 },
    skillParameters: {
      type: [String],
      default: [
        "Dribbling",
        "Passing",
        "Shooting",
        "Speed",
        "Tactical Awareness",
        "Attitude",
      ],
    },
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        const { _id, __v, ...rest } = ret;

        return {
          ...rest,
          id: _id.toString(),
        };
      },
    },
  },
);

// Soft delete filter
AcademySchema.pre(
  /^find/,
  function (this: mongoose.Query<any, AcademyDocument>, next) {
    this.where({ deletedAt: { $exists: false } });
    next();
  },
);

export const AcademyModel = mongoose.model<AcademyDocument>(
  "Academy",
  AcademySchema,
);
