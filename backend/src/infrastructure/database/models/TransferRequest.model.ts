// src/infrastructure/database/models/TransferRequest.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface TransferRequestDocument extends Document {
  listingId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  fromFranchiseId: mongoose.Types.ObjectId;
  fromManagerId: mongoose.Types.ObjectId;
  toFranchiseId: mongoose.Types.ObjectId;
  toManagerId: mongoose.Types.ObjectId;
  offeredPrice: number;
  currency: string;
  status: string;
  message?: string;
  responseNote?: string;
  respondedAt?: Date;
  completedAt?: Date;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransferRequestSchema = new Schema<TransferRequestDocument>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "TransferListing", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    fromFranchiseId: { type: Schema.Types.ObjectId, ref: "Franchise", required: true },
    fromManagerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    toFranchiseId: { type: Schema.Types.ObjectId, ref: "Franchise" },
    toManagerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    offeredPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    message: String,
    responseNote: String,
    respondedAt: Date,
    completedAt: Date,
    transactionId: String,
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

TransferRequestSchema.index({ toManagerId: 1, status: 1 });
TransferRequestSchema.index({ fromManagerId: 1, status: 1 });

export const TransferRequestModel = mongoose.model<TransferRequestDocument>(
  "TransferRequest",
  TransferRequestSchema,
);
