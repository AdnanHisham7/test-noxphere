// src/store/api/studentPortalApi.ts
import { baseApi } from "./baseApi";

export interface MyDashboard {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string;
    attendancePercentage: number;
    overallRating: number;
    team?: { name: string; ageGroup: string };
    position?: string;
    jerseyNumber?: number;
  };
  todayStatus: string | null;
  upcomingFees: { installmentNumber: number; amount: number; dueDate: string }[];
  overdueFees: { installmentNumber: number; amount: number; dueDate: string }[];
  recentRemarks: { _id: string; text: string; date: string }[];
}

export interface AttendanceRecord {
  _id: string;
  sessionDate: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
}

export interface AttendanceResult {
  records: AttendanceRecord[];
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
  };
}

export interface FeeInstallment {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: string;
}

export interface FeeRecord {
  _id: string;
  feeType: string;
  finalAmount: number;
  overallStatus: string;
  installments: FeeInstallment[];
}

export interface PerformanceBundle {
  performance: { _id: string; createdAt: string; overallRating?: number; notes?: string }[];
  remarks: { _id: string; text: string; date: string }[];
}

export const studentPortalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyDashboard: builder.query<MyDashboard, void>({
      query: () => "/me/dashboard",
      transformResponse: (res: { data: MyDashboard }) => res.data,
      providesTags: ["Student", "Attendance", "Fee"],
    }),
    getMyAttendance: builder.query<AttendanceResult, { month?: string } | void>({
      query: (args) => ({
        url: "/me/attendance",
        params: args?.month ? { month: args.month } : undefined,
      }),
      transformResponse: (res: { data: AttendanceResult }) => res.data,
      providesTags: ["Attendance"],
    }),
    getMyFees: builder.query<FeeRecord[], void>({
      query: () => "/me/fees",
      transformResponse: (res: { data: FeeRecord[] }) => res.data,
      providesTags: ["Fee"],
    }),
    getMyPerformance: builder.query<PerformanceBundle, void>({
      query: () => "/me/performance",
      transformResponse: (res: { data: PerformanceBundle }) => res.data,
      providesTags: ["Performance"],
    }),
  }),
});

export const {
  useGetMyDashboardQuery,
  useGetMyAttendanceQuery,
  useGetMyFeesQuery,
  useGetMyPerformanceQuery,
} = studentPortalApi;
