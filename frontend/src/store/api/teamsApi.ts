// src/store/api/teamsApi.ts
import { baseApi } from "./baseApi";

export interface Team {
  id: string;
  name: string;
  ageGroup: string;
  coach?: { _id: string; firstName: string; lastName: string };
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  studentCount: number;
}

export interface TeamDetail extends Omit<Team, "coach"> {
  coachId?: { firstName: string; lastName: string };
  students: {
    _id: string;
    firstName: string;
    lastName: string;
    photo?: string;
    jerseyNumber?: number;
    position?: string;
    attendancePercentage: number;
    overallRating: number;
  }[];
}

export interface CreateTeamBody {
  name: string;
  ageGroup: string;
  franchiseId: string;
  coachId?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export const teamsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listTeams: builder.query<Team[], { franchiseId: string }>({
      query: ({ franchiseId }) => ({ url: "/teams", params: { franchiseId } }),
      transformResponse: (res: { data: Team[] }) => res.data,
      providesTags: ["Team"],
    }),
    getTeamById: builder.query<TeamDetail, string>({
      query: (id) => `/teams/${id}`,
      transformResponse: (res: { data: TeamDetail }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Team", id }],
    }),
    createTeam: builder.mutation<Team, CreateTeamBody>({
      query: (body) => ({ url: "/teams", method: "POST", body }),
      transformResponse: (res: { data: Team }) => res.data,
      invalidatesTags: ["Team"],
    }),
    updateTeam: builder.mutation<Team, { id: string; body: Partial<CreateTeamBody> }>({
      query: ({ id, body }) => ({ url: `/teams/${id}`, method: "PUT", body }),
      transformResponse: (res: { data: Team }) => res.data,
      invalidatesTags: ["Team"],
    }),
    deleteTeam: builder.mutation<void, string>({
      query: (id) => ({ url: `/teams/${id}`, method: "DELETE" }),
      invalidatesTags: ["Team"],
    }),
  }),
});

export const {
  useListTeamsQuery,
  useGetTeamByIdQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} = teamsApi;