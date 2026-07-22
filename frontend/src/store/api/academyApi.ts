// src/store/api/academyApi.ts
import { Academy, AcademyConfigPayload, CreateAcademyPayload } from '@/features/academies/types';
import { baseApi } from './baseApi';

interface AcademyListResponse {
  data: Academy[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const academyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAcademies: builder.query<
      AcademyListResponse,
      { isActive?: boolean; search?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/academies", params }),
      // Update this section:
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Academy" as const, id })),
              { type: "Academy", id: "LIST" },
            ]
          : [{ type: "Academy", id: "LIST" }],
      transformResponse: (response: any) => response.data,
    }),
    getAcademyById: builder.query<Academy, string>({
      query: (id) => `/academies/${id}`,
      providesTags: (_, __, id) => [{ type: "Academy", id }],
    }),
    createAcademy: builder.mutation<Academy, CreateAcademyPayload>({
      query: (body) => ({ url: "/academies", method: "POST", body }),
      invalidatesTags: [{ type: "Academy", id: "LIST" }],
    }),
    updateAcademy: builder.mutation<
      Academy,
      { id: string; data: Partial<Academy> }
    >({
      query: ({ id, data }) => ({
        url: `/academies/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: "Academy", id }],
    }),
    updateAcademyConfig: builder.mutation<
      Academy,
      { id: string; config: AcademyConfigPayload }
    >({
      query: ({ id, config }) => ({
        url: `/academies/${id}/config`,
        method: "PATCH",
        body: config,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Academy", id }],
    }),
    toggleAcademyStatus: builder.mutation<Academy, string>({
      query: (id) => ({
        url: `/academies/${id}/toggle-status`,
        method: "PATCH",
      }),
      // This will now correctly trigger a refetch of getAcademies 
      // because the IDs will match.
      invalidatesTags: (result, error, id) => [{ type: "Academy", id }],
    }),
    toggleTransferWall: builder.mutation<Academy, string>({
      query: (id) => ({
        url: `/academies/${id}/transfer-wall`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Academy", id }],
    }),
    deleteAcademy: builder.mutation<void, string>({
      query: (id) => ({ url: `/academies/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Academy", id: "LIST" }],
    }),
  }),
});