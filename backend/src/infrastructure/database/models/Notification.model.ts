import mongoose, { Schema, Document } from "mongoose";

export type NotificationAudience = "all" | "guardians" | "coaches" | "students" | "team";

export interface NotificationDocument extends Document {
  franchiseId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  audience: NotificationAudience;
  teamId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    franchiseId: { type: Schema.Types.ObjectId, ref: "Franchise", required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    audience: {
      type: String,
      enum: ["all", "guardians", "coaches", "students", "team"],
      required: true,
      default: "all",
    },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
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

NotificationSchema.index({ franchiseId: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<NotificationDocument>("Notification", NotificationSchema);
