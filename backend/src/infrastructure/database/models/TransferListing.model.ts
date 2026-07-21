// src/infrastructure/database/models/TransferListing.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface TransferListingDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  fromFranchiseId: mongoose.Types.ObjectId;
  fromManagerId: mongoose.Types.ObjectId;
  price: number;
  currency: string;
  note?: string;
  skills: string[];
  highlights: string[];
  overallRating: number;
  isPublic: boolean;
  isActive: boolean;
  expiresAt?: Date;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransferListingSchema = new Schema<TransferListingDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    fromFranchiseId: { type: Schema.Types.ObjectId, ref: "Franchise", required: true, index: true },
    fromManagerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    note: String,
    skills: [String],
    highlights: [String],
    overallRating: { type: Number, default: 0, min: 0, max: 10 },
    isPublic: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: Date,
    viewCount: { type: Number, default: 0 },
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

TransferListingSchema.index({ isActive: 1, isPublic: 1, createdAt: -1 });
TransferListingSchema.index({ studentId: 1, isActive: 1 });

export const TransferListingModel = mongoose.model<TransferListingDocument>(
  "TransferListing",
  TransferListingSchema,
);
