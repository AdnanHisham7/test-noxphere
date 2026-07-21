// src/store/api/coachPortalApi.ts
//
// Attendance/performance are recorded exclusively against a real scheduled
// session now — see scheduleApi's markSessionAttendance/logSessionPerformance,
// reached from a session's roster page. This slice keeps the coach
// dashboard/roster reads and the freeform coach-remark write (notes aren't
// tied to a session, which is fine — they're not attendance or scores).
import { baseApi } from "./baseApi";

export interface RosterStudent {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  attendancePercentage: number;
  overallRating: number;
}

export interface CoachSessionCard {
  id: string;
  teamName: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
}

export interface CoachDashboard {
  roster: RosterStudent[];
  todaySessions: CoachSessionCard[];
  upcomingSessions: CoachSessionCard[];
}

export interface AddRemarkBody {
  studentId: string;
  text: string;
}

export interface StudentBasic {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  attendancePercentage: number;
  overallRating: number;
  position?: string;
  jerseyNumber?: number;
}

export const coachPortalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudentBasic: builder.query<StudentBasic, string>({
      query: (id) => `/students/${id}`,
      transformResponse: (res: { data: StudentBasic }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Student", id }],
    }),
    getCoachDashboard: builder.query<CoachDashboard, void>({
      query: () => "/coach/dashboard",
      transformResponse: (res: { data: CoachDashboard }) => res.data,
      providesTags: ["Student", "Attendance"],
    }),
    getMyRoster: builder.query<RosterStudent[], void>({
      query: () => "/coach/roster",
      transformResponse: (res: { data: RosterStudent[] }) => res.data,
      providesTags: ["Student"],
    }),
    addCoachRemark: builder.mutation<unknown, AddRemarkBody>({
      query: ({ studentId, text }) => ({
        url: `/students/${studentId}/remarks`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: ["Performance"],
    }),
  }),
});

export const {
  useGetCoachDashboardQuery,
  useGetMyRosterQuery,
  useGetStudentBasicQuery,
  useAddCoachRemarkMutation,
} = coachPortalApi;
