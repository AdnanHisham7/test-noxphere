// src/infrastructure/database/models/Resource.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ResourceDocument extends Document {
  franchiseId: mongoose.Types.ObjectId;
  academyId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string;
  publicId: string;
  mimeType: string;
  fileSizeBytes: number;
  verified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<ResourceDocument>(
  {
    franchiseId: { type: Schema.Types.ObjectId, ref: "Franchise", required: true, index: true },
    academyId: { type: Schema.Types.ObjectId, ref: "Academy", required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true, min: 0 },
    verified: { type: Boolean, default: false, index: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
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

ResourceSchema.pre(/^find/, function (this: mongoose.Query<unknown, ResourceDocument>, next) {
  this.where({ deletedAt: { $exists: false } });
  next();
});

ResourceSchema.index({ franchiseId: 1, createdAt: -1 });
ResourceSchema.index({ academyId: 1, deletedAt: 1 });

export const ResourceModel = mongoose.model<ResourceDocument>("Resource", ResourceSchema);