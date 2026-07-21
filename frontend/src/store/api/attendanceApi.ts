// src/store/api/attendanceApi.ts
//
// Marking attendance now happens exclusively via scheduleApi's
// markSessionAttendance (POST /schedule/:id/attendance) — attendance can
// only be recorded against a real scheduled session. This slice is
// read-only: attendance history/reporting across sessions and date ranges.
import { baseApi } from "./baseApi";

export interface AttendanceHistoryEntry {
  _id: string;
  studentId: { _id: string; firstName: string; lastName: string; photo?: string };
  teamId: { _id: string; name: string };
  sessionId: { _id: string; date: string; type: string; location: string } | null;
  sessionDate: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
}

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceHistory: builder.query<
      AttendanceHistoryEntry[],
      { franchiseId: string; teamId?: string; studentId?: string; from?: string; to?: string }
    >({
      query: (params) => ({ url: "/attendance", params }),
      transformResponse: (res: { data: AttendanceHistoryEntry[] }) => res.data,
      providesTags: ["Attendance"],
    }),
  }),
});

export const { useGetAttendanceHistoryQuery } = attendanceApi;
