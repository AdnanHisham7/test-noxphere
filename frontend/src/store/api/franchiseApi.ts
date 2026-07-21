// src/store/api/franchiseApi.ts
import { baseApi } from "./baseApi";

export interface FranchiseLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  fieldNumber?: string;
}

export interface Franchise {
  id: string;
  academyId: string;
  academyName?: string;
  name: string;
  franchiseCode: string;
  managerId?: string;
  location: FranchiseLocation;
  ageGroups: string[];
  maxStudents: number;
  isActive: boolean;
  alertBeforeMinutes: number;
  notificationAlertAfterMinutes: number;
  skillParameters: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFranchiseBody {
  academyId: string;
  name: string;
  managerId?: string;
  location: FranchiseLocation;
  ageGroups?: string[];
  maxStudents?: number;
  alertBeforeMinutes?: number;
  notificationAlertAfterMinutes?: number;
  skillParameters?: string[];
}

export const franchiseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFranchises: builder.query<Franchise[], { academyId?: string; isActive?: boolean } | void>({
      query: (params) => ({ url: "/franchises", params: params ?? {} }),
      transformResponse: (res: { data: Franchise[] }) => res.data,
      providesTags: (result) =>
        result
          ? [...result.map((f) => ({ type: "Franchise" as const, id: f.id })), { type: "Franchise", id: "LIST" }]
          : [{ type: "Franchise", id: "LIST" }],
    }),
    getFranchiseById: builder.query<Franchise, string>({
      query: (id) => `/franchises/${id}`,
      transformResponse: (res: { data: Franchise }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Franchise", id }],
    }),
    createFranchise: builder.mutation<Franchise, CreateFranchiseBody>({
      query: (body) => ({ url: "/franchises", method: "POST", body }),
      transformResponse: (res: { data: Franchise }) => res.data,
      invalidatesTags: [{ type: "Franchise", id: "LIST" }],
    }),
    updateFranchise: builder.mutation<Franchise, { id: string; data: Partial<CreateFranchiseBody> }>({
      query: ({ id, data }) => ({ url: `/franchises/${id}`, method: "PUT", body: data }),
      transformResponse: (res: { data: Franchise }) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Franchise", id }, { type: "Franchise", id: "LIST" }],
    }),
    toggleFranchiseActive: builder.mutation<Franchise, string>({
      query: (id) => ({ url: `/franchises/${id}/toggle-active`, method: "PATCH" }),
      transformResponse: (res: { data: Franchise }) => res.data,
      invalidatesTags: (_r, _e, id) => [{ type: "Franchise", id }, { type: "Franchise", id: "LIST" }],
    }),
    deleteFranchise: builder.mutation<void, { id: string; academyId: string }>({
      query: ({ id, academyId }) => ({ url: `/franchises/${id}`, method: "DELETE", body: { academyId } }),
      invalidatesTags: [{ type: "Franchise", id: "LIST" }],
    }),
  }),
});

export const {
  useGetFranchisesQuery,
  useGetFranchiseByIdQuery,
  useCreateFranchiseMutation,
  useUpdateFranchiseMutation,
  useToggleFranchiseActiveMutation,
  useDeleteFranchiseMutation,
} = franchiseApi;
