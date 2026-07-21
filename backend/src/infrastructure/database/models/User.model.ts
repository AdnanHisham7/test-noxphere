// src/infrastructure/database/models/User.model.ts
import mongoose, { Schema, Document } from "mongoose";
import {
  UserEntity,
  UserRole,
  defaultPermissions,
} from "../../../domain/entities/User.entity";

export interface UserDocument extends Omit<UserEntity, "id">, Document {}

const PermissionsSchema = new Schema(
  {
    canManageUsers: { type: Boolean, default: false },
    canManageFranchises: { type: Boolean, default: false },
    canManageSessions: { type: Boolean, default: false },
    canManageFinance: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageAttendance: { type: Boolean, default: false },
    canManagePerformance: { type: Boolean, default: false },
    canManageSelection: { type: Boolean, default: false },
    canSendNotifications: { type: Boolean, default: false },
  },
  { _id: false },
);

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["super_admin", "manager", "coach", "student", "guardian"],
      required: true,
      index: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    permissions: { type: PermissionsSchema, required: true },
    fcmTokens: [{ type: String }],
    franchiseId: { type: Schema.Types.ObjectId, ref: "Franchise", index: true },
    lastLoginAt: { type: Date },
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        const { _id, __v, passwordHash, ...rest } = ret;

        return {
          ...rest,
          id: _id.toString(),
        };
      },
    },
  },
);

// Soft delete filter
UserSchema.pre(
  /^find/,
  function (this: mongoose.Query<unknown, UserDocument>, next) {
    this.where({ deletedAt: { $exists: false } });
    next();
  },
);

// Auto-set default permissions on role assignment
UserSchema.pre("save", function (next) {
  if (this.isModified("role") && !this.permissions) {
    this.permissions = defaultPermissions[this.role as UserRole];
  }
  next();
});

UserSchema.index({ email: 1, deletedAt: 1 });
UserSchema.index({ franchiseId: 1, role: 1, isActive: 1 });

export const UserModel = mongoose.model<UserDocument>("User", UserSchema);