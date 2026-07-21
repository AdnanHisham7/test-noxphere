// src/store/api/adminPerformanceApi.ts
import { baseApi } from "./baseApi";

export interface AdminPerformanceRecord {
  _id: string;
  studentId: { _id: string; firstName: string; lastName: string; photo?: string };
  coachId?: { firstName: string; lastName: string };
  sessionDate: string;
  skillScores: { parameter: string; score: number }[];
  overallScore: number;
  remarks?: string;
}

export const adminPerformanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPerformance: builder.query<
      AdminPerformanceRecord[],
      { franchiseId: string; teamId?: string; studentId?: string }
    >({
      query: (params) => ({ url: "/performance", params }),
      transformResponse: (res: { data: AdminPerformanceRecord[] }) => res.data,
      providesTags: ["Performance"],
    }),
  }),
});

export const { useListPerformanceQuery } = adminPerformanceApi;
