import mongoose, { Schema, Document } from "mongoose";

export interface TeamDocument extends Document {
  name: string;
  ageGroup: string;
  franchiseId: mongoose.Types.ObjectId;
  coachId?: mongoose.Types.ObjectId;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const TeamSchema = new Schema<TeamDocument>(
  {
    name: { type: String, required: true, trim: true },
    ageGroup: { type: String, required: true, trim: true },
    franchiseId: { type: Schema.Types.ObjectId, ref: "Franchise", required: true, index: true },
    coachId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    description: String,
    logoUrl: String,
    bannerUrl: String,
    primaryColor: { type: String, match: HEX_COLOR_REGEX, default: "#1f2937" },
    secondaryColor: { type: String, match: HEX_COLOR_REGEX, default: "#334155" },
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

TeamSchema.index({ franchiseId: 1, name: 1 });

export const TeamModel = mongoose.model<TeamDocument>("Team", TeamSchema);