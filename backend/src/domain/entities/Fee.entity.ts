// src/domain/entities/Fee.entity.ts
export type FeeType = 'one_time' | 'installment' | 'early_bird';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded';
export type PaymentMethod = 'online' | 'cash' | 'cheque' | 'upi' | 'card' | 'wallet';
export type PaymentGateway = 'stripe' | 'razorpay' | 'paypal';

export interface FeeInstallment {
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  paidAmount: number;
  paidAt?: Date;
  status: PaymentStatus;
  transactionId?: string;
  paymentMethod?: PaymentMethod;
  gateway?: PaymentGateway;
  receiptUrl?: string;
  reminderSentCount: number;
  lastReminderAt?: Date;
}

export interface FeeEntity {
  id: string;
  studentId: string;
  franchiseId: string;
  feeType: FeeType;
  totalAmount: number;
  currency: string;
  discount: number;
  promoCode?: string;
  finalAmount: number;
  installments: FeeInstallment[];
  overallStatus: PaymentStatus;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// src/domain/entities/Transfer.entity.ts
export type TransferRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface TransferWallListingEntity {
  id: string;
  studentId: string;
  fromFranchiseId: string;
  fromManagerId: string;
  price: number;
  currency: string;
  note?: string;
  skills: string[];
  highlights: string[];
  overallRating: number;
  isPublic: boolean;
  expiresAt?: Date;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferRequestEntity {
  id: string;
  listingId: string;
  studentId: string;
  fromFranchiseId: string;
  fromManagerId: string;
  toFranchiseId: string;
  toManagerId: string;
  offeredPrice: number;
  currency: string;
  status: TransferRequestStatus;
  message?: string;
  responseNote?: string;
  respondedAt?: Date;
  completedAt?: Date;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
