import { FeeModel } from "../../../infrastructure/database/models/Fee.model";
import { NotFoundError, BadRequestError } from "../../../shared/errors/AppError";

export interface CreateFeeInput {
  studentId: string;
  franchiseId: string;
  feeType: "one_time" | "installment" | "early_bird";
  totalAmount: number;
  discount?: number;
  promoCode?: string;
  installments: { installmentNumber: number; amount: number; dueDate: string }[];
  notes?: string;
}

export interface RecordPaymentInput {
  amount: number;
  paymentMethod?: string;
  transactionId?: string;
}

function computeOverallStatus(installments: { status: string }[]): string {
  if (installments.every((i) => i.status === "paid")) return "paid";
  if (installments.some((i) => i.status === "overdue")) return "overdue";
  if (installments.some((i) => i.status === "partial" || i.status === "paid")) return "partial";
  return "pending";
}

export class AdminFeesUseCases {
  async createFee(input: CreateFeeInput, createdBy: string) {
    const discount = input.discount ?? 0;
    const finalAmount = input.totalAmount - discount;

    const fee = await FeeModel.create({
      studentId: input.studentId,
      franchiseId: input.franchiseId,
      feeType: input.feeType,
      totalAmount: input.totalAmount,
      discount,
      promoCode: input.promoCode,
      finalAmount,
      notes: input.notes,
      createdBy,
      installments: input.installments.map((i) => ({
        installmentNumber: i.installmentNumber,
        amount: i.amount,
        dueDate: new Date(i.dueDate),
        paidAmount: 0,
        status: "pending",
        reminderSentCount: 0,
      })),
    });

    return fee.toJSON ? fee.toJSON() : fee;
  }

  async listFees(franchiseId: string, filters: { studentId?: string; status?: string } = {}) {
    const query: Record<string, unknown> = { franchiseId };
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.status) query.overallStatus = filters.status;

    return FeeModel.find(query)
      .populate("studentId", "firstName lastName photo")
      .sort({ createdAt: -1 })
      .lean();
  }

  async getFeeById(id: string) {
    const fee = await FeeModel.findById(id).populate("studentId", "firstName lastName photo").lean();
    if (!fee) throw new NotFoundError("Fee record not found");
    return fee;
  }

  async recordPayment(feeId: string, installmentNumber: number, input: RecordPaymentInput) {
    if (input.amount <= 0) throw new BadRequestError("Payment amount must be greater than zero");

    const fee = await FeeModel.findById(feeId);
    if (!fee) throw new NotFoundError("Fee record not found");

    const installment = fee.installments.find((i) => i.installmentNumber === installmentNumber);
    if (!installment) throw new NotFoundError("Installment not found");

    installment.paidAmount = Math.min(installment.amount, installment.paidAmount + input.amount);
    installment.paidAt = new Date();
    installment.paymentMethod = input.paymentMethod;
    installment.transactionId = input.transactionId;
    installment.status = installment.paidAmount >= installment.amount ? "paid" : "partial";

    // mark any past-due, still-unpaid installments as overdue
    const now = new Date();
    for (const inst of fee.installments) {
      if (inst.status === "pending" && inst.dueDate < now) inst.status = "overdue";
    }

    fee.overallStatus = computeOverallStatus(fee.installments) as typeof fee.overallStatus;
    await fee.save();

    return fee.toJSON ? fee.toJSON() : fee;
  }
}
