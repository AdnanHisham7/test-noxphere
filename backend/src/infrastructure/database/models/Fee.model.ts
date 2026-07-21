// src/infrastructure/database/models/Fee.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface FeeDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  franchiseId: mongoose.Types.ObjectId;
  feeType: string;
  totalAmount: number;
  currency: string;
  discount: number;
  promoCode?: string;
  finalAmount: number;
  installments: {
    installmentNumber: number;
    amount: number;
    dueDate: Date;
    paidAmount: number;
    paidAt?: Date;
    status: string;
    transactionId?: string;
    paymentMethod?: string;
    gateway?: string;
    receiptUrl?: string;
    reminderSentCount: number;
    lastReminderAt?: Date;
  }[];
  overallStatus: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InstallmentSchema = new Schema({
  installmentNumber: { type: Number, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paidAmount: { type: Number, default: 0 },
  paidAt: Date,
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'refunded'],
    default: 'pending',
  },
  transactionId: String,
  paymentMethod: String,
  gateway: String,
  receiptUrl: String,
  reminderSentCount: { type: Number, default: 0 },
  lastReminderAt: Date,
}, { _id: false });

const FeeSchema = new Schema<FeeDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    franchiseId: { type: Schema.Types.ObjectId, ref: 'Franchise', required: true, index: true },
    feeType: { type: String, enum: ['one_time', 'installment', 'early_bird'], required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    discount: { type: Number, default: 0 },
    promoCode: String,
    finalAmount: { type: Number, required: true },
    installments: [InstallmentSchema],
    overallStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue', 'refunded'],
      default: 'pending',
      index: true,
    },
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

FeeSchema.index({ franchiseId: 1, overallStatus: 1 });
FeeSchema.index({ 'installments.dueDate': 1, 'installments.status': 1 });

export const FeeModel = mongoose.model<FeeDocument>('Fee', FeeSchema);

// NOTE: Transfer Wall models (TransferListing, TransferRequest) used to be
// declared here too, which collided with the canonical
// TransferListing.model.ts / TransferRequest.model.ts and crashed the
// process with a mongoose OverwriteModelError as soon as both files were
// imported. Use those dedicated files instead — they also add the
// `isActive` flag needed to support delisting a player from the transfer
// wall without deleting transfer history.
