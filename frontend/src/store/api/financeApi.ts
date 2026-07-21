// src/store/api/financeApi.ts
import { baseApi } from "./baseApi";

export interface FinanceOverview {
  totalRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueCount: number;
  overdueAmount: number;
  collectionRate: number;
  totalInvoices: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  collected: number;
}

export interface AcademyRevenue {
  academyId: string;
  academyName: string;
  revenue: number;
  collected: number;
  outstanding: number;
  studentCount: number;
}

export interface OverdueInvoice {
  id: string;
  student: string;
  totalAmount: number;
  outstanding: number;
  overallStatus: string;
}

export interface Transaction {
  feeId: string;
  student: string;
  amount: number;
  paidAt: string;
  method?: string;
  transactionId?: string;
}

export const financeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFinanceOverview: builder.query<FinanceOverview, { from?: string; to?: string; academyId?: string } | void>({
      query: (params) => ({ url: "/finance/overview", params: params ?? {} }),
      providesTags: ["Finance"],
    }),
    getRevenueByMonth: builder.query<MonthlyRevenue[], { academyId?: string; months?: number } | void>({
      query: (params) => ({ url: "/finance/revenue-by-month", params: params ?? {} }),
      providesTags: ["Finance"],
    }),
    getRevenueByAcademy: builder.query<AcademyRevenue[], void>({
      query: () => "/finance/revenue-by-academy",
      providesTags: ["Finance"],
    }),
    getOverdueInvoices: builder.query<
      { data: OverdueInvoice[]; total: number; page: number; limit: number; totalPages: number },
      { academyId?: string; page?: number; limit?: number } | void
    >({
      query: (params) => ({ url: "/finance/overdue", params: params ?? {} }),
      providesTags: ["Finance"],
    }),
    getRecentTransactions: builder.query<Transaction[], { academyId?: string; limit?: number } | void>({
      query: (params) => ({ url: "/finance/transactions", params: params ?? {} }),
      providesTags: ["Finance"],
    }),
  }),
});

export const {
  useGetFinanceOverviewQuery,
  useGetRevenueByMonthQuery,
  useGetRevenueByAcademyQuery,
  useGetOverdueInvoicesQuery,
  useGetRecentTransactionsQuery,
} = financeApi;
