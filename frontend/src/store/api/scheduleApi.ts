// src/store/api/scheduleApi.ts
import { baseApi } from "./baseApi";

export interface Session {
  id: string;
  franchiseId: string;
  teamId: string;
  teamName?: string;
  category?: string;
  categoryColor?: string;
  coach?: string;
  coachId: string;
  type: "training" | "match" | "trial" | "fitness";
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  fieldNumber?: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionInput {
  franchiseId: string;
  teamId: string;
  coachId: string;
  type: Session["type"];
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  fieldNumber?: string;
  notes?: string;
}

export interface RosterPlayer {
  studentId: string;
  firstName: string;
  lastName: string;
  photo?: string;
  position?: string;
  jerseyNumber?: number;
  attendanceStatus: "present" | "absent" | "late" | "excused" | null;
  attendanceRemarks: string | null;
  performanceRecorded: boolean;
  skillScores: { parameter: string; score: number }[] | null;
  overallScore: number | null;
  performanceRemarks: string | null;
}

export interface SessionRoster {
  session: Session;
  roster: RosterPlayer[];
}

export const scheduleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<
      Session[],
      { franchiseId: string; from?: string; to?: string; teamId?: string; coachId?: string; status?: string }
    >({
      query: (params) => ({ url: "/schedule", params }),
      // Transform response to return the internal array
      transformResponse: (res: { data: Session[] } | Session[]) =>
        Array.isArray(res) ? res : res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [...result.map((s) => ({ type: "Schedule" as const, id: s.id })), { type: "Schedule", id: "LIST" }]
          : [{ type: "Schedule", id: "LIST" }],
    }),
    getSessionById: builder.query<Session, string>({
      query: (id) => `/schedule/${id}`,
      transformResponse: (res: { data: Session } | Session) =>
        'data' in res ? res.data : res,
      providesTags: (_r, _e, id) => [{ type: "Schedule", id }],
    }),
    getSessionRoster: builder.query<SessionRoster, string>({
      query: (id) => `/schedule/${id}/roster`,
      transformResponse: (res: { data: SessionRoster }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Schedule", id: `roster-${id}` }],
    }),
    markSessionAttendance: builder.mutation<
      SessionRoster,
      { id: string; records: { studentId: string; status: "present" | "absent" | "late" | "excused"; remarks?: string }[] }
    >({
      query: ({ id, records }) => ({ url: `/schedule/${id}/attendance`, method: "POST", body: { records } }),
      transformResponse: (res: { data: SessionRoster }) => res.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Schedule", id },
        { type: "Schedule", id: `roster-${id}` },
        { type: "Schedule", id: "LIST" },
        "Dashboard",
        "Student",
      ],
    }),
    logSessionPerformance: builder.mutation<
      SessionRoster,
      {
        id: string;
        records: {
          studentId: string;
          skillScores: { parameter: string; score: number }[];
          remarks?: string;
          videoUrl?: string;
        }[];
      }
    >({
      query: ({ id, records }) => ({ url: `/schedule/${id}/performance`, method: "POST", body: { records } }),
      transformResponse: (res: { data: SessionRoster }) => res.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Schedule", id },
        { type: "Schedule", id: `roster-${id}` },
        { type: "Schedule", id: "LIST" },
        "Dashboard",
        "Student",
      ],
    }),
    createSession: builder.mutation<Session, CreateSessionInput>({
      query: (body) => ({ url: "/schedule", method: "POST", body }),
      invalidatesTags: [{ type: "Schedule", id: "LIST" }],
    }),
    updateSession: builder.mutation<Session, { id: string; data: Partial<CreateSessionInput> & { status?: Session["status"] } }>({
      query: ({ id, data }) => ({ url: `/schedule/${id}`, method: "PUT", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Schedule", id }, { type: "Schedule", id: "LIST" }],
    }),
    cancelSession: builder.mutation<Session, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/schedule/${id}/cancel`, method: "PATCH", body: { reason } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Schedule", id }, { type: "Schedule", id: "LIST" }],
    }),
    changeSessionLocation: builder.mutation<
      Session,
      { id: string; location: string; fieldNumber?: string; notifyGuardians?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/schedule/${id}/location`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Schedule", id }, { type: "Schedule", id: "LIST" }],
    }),
    deleteSession: builder.mutation<void, string>({
      query: (id) => ({ url: `/schedule/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Schedule", id: "LIST" }],
    }),
    alertAllGuardians: builder.mutation<{ notified: number }, { franchiseId: string; message?: string }>({
      query: (body) => ({ url: "/schedule/alert-guardians", method: "POST", body }),
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useGetSessionByIdQuery,
  useGetSessionRosterQuery,
  useMarkSessionAttendanceMutation,
  useLogSessionPerformanceMutation,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useCancelSessionMutation,
  useChangeSessionLocationMutation,
  useDeleteSessionMutation,
  useAlertAllGuardiansMutation,
} = scheduleApi;
