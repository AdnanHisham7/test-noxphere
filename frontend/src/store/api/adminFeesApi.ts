// src/store/api/adminFeesApi.ts
import { baseApi } from "./baseApi";

export interface FeeInstallment {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  paidAt?: string;
  status: string;
}

export interface AdminFeeRecord {
  _id: string;
  studentId: { _id: string; firstName: string; lastName: string; photo?: string };
  feeType: string;
  totalAmount: number;
  finalAmount: number;
  overallStatus: string;
  installments: FeeInstallment[];
  createdAt: string;
}

export interface CreateFeeBody {
  studentId: string;
  franchiseId: string;
  feeType: "one_time" | "installment" | "early_bird";
  totalAmount: number;
  discount?: number;
  installments: { installmentNumber: number; amount: number; dueDate: string }[];
  notes?: string;
}

export const adminFeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFees: builder.query<AdminFeeRecord[], { franchiseId: string; studentId?: string; status?: string }>({
      query: (params) => ({ url: "/fees", params }),
      transformResponse: (res: { data: AdminFeeRecord[] }) => res.data,
      providesTags: ["Fee"],
    }),
    createFee: builder.mutation<AdminFeeRecord, CreateFeeBody>({
      query: (body) => ({ url: "/fees", method: "POST", body }),
      transformResponse: (res: { data: AdminFeeRecord }) => res.data,
      invalidatesTags: ["Fee", "Student"],
    }),
    recordPayment: builder.mutation<
      AdminFeeRecord,
      { feeId: string; installmentNumber: number; amount: number; paymentMethod?: string; transactionId?: string }
    >({
      query: ({ feeId, installmentNumber, ...body }) => ({
        url: `/fees/${feeId}/installments/${installmentNumber}/pay`,
        method: "POST",
        body,
      }),
      transformResponse: (res: { data: AdminFeeRecord }) => res.data,
      invalidatesTags: ["Fee", "Student"],
    }),
  }),
});

export const { useListFeesQuery, useCreateFeeMutation, useRecordPaymentMutation } = adminFeesApi;
