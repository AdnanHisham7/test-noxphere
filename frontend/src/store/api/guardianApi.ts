// src/store/api/guardianApi.ts
import { baseApi } from "./baseApi";

export interface GuardianChild {
  _id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  ageGroup: string;
  position?: string;
  jerseyNumber?: number;
  attendancePercentage: number;
  overallRating: number;
  teamId?: { name: string; ageGroup: string };
}

export interface GuardianDashboard {
  children: {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string;
    attendancePercentage: number;
    overallRating: number;
  }[];
  todayAttendance: { studentId: string; status: string }[];
  upcomingFees: { studentId: string; installmentNumber: number; amount: number; dueDate: string }[];
  overdueFees: { studentId: string; installmentNumber: number; amount: number; dueDate: string }[];
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
  paidAt?: string;
  status: string;
}

export interface FeeRecord {
  _id: string;
  feeType: string;
  totalAmount: number;
  finalAmount: number;
  overallStatus: string;
  installments: FeeInstallment[];
}

export interface PerformanceRecord {
  _id: string;
  createdAt: string;
  overallRating?: number;
  notes?: string;
  [key: string]: unknown;
}

export const guardianApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGuardianDashboard: builder.query<GuardianDashboard, void>({
      query: () => "/guardian/dashboard",
      transformResponse: (res: { data: GuardianDashboard }) => res.data,
      providesTags: ["Student", "Attendance", "Fee"],
    }),
    getMyChildren: builder.query<GuardianChild[], void>({
      query: () => "/guardian/children",
      transformResponse: (res: { data: GuardianChild[] }) => res.data,
      providesTags: ["Student"],
    }),
    getChildProfile: builder.query<GuardianChild, string>({
      query: (studentId) => `/guardian/children/${studentId}`,
      transformResponse: (res: { data: GuardianChild }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Student", id }],
    }),
    getChildAttendance: builder.query<AttendanceResult, { studentId: string; month?: string }>({
      query: ({ studentId, month }) => ({
        url: `/guardian/children/${studentId}/attendance`,
        params: month ? { month } : undefined,
      }),
      transformResponse: (res: { data: AttendanceResult }) => res.data,
      providesTags: (_r, _e, { studentId }) => [{ type: "Attendance", id: studentId }],
    }),
    getChildFees: builder.query<FeeRecord[], string>({
      query: (studentId) => `/guardian/children/${studentId}/fees`,
      transformResponse: (res: { data: FeeRecord[] }) => res.data,
      providesTags: (_r, _e, studentId) => [{ type: "Fee", id: studentId }],
    }),
    getChildPerformance: builder.query<PerformanceRecord[], string>({
      query: (studentId) => `/guardian/children/${studentId}/performance`,
      transformResponse: (res: { data: PerformanceRecord[] }) => res.data,
      providesTags: (_r, _e, studentId) => [{ type: "Performance", id: studentId }],
    }),
  }),
});

export const {
  useGetGuardianDashboardQuery,
  useGetMyChildrenQuery,
  useGetChildProfileQuery,
  useGetChildAttendanceQuery,
  useGetChildFeesQuery,
  useGetChildPerformanceQuery,
} = guardianApi;
