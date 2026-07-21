// src/store/api/selectionApi.ts
import { baseApi } from "./baseApi";

export interface SelectionCandidate {
  id: string;
  name: string;
  position: string;
  ageGroup: string;
  rating: number;
  coachVote: "Recommended" | "On Hold" | "Not Recommended" | "Pending Review";
  coachNote: string;
  status: "pending" | "shortlisted" | "on_hold" | "selected" | "not_selected" | "released";
  phase: string | null;
  photo?: string;
}

export const selectionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSelectionList: builder.query<SelectionCandidate[], { franchiseId: string; phase?: string; ageGroup?: string }>({
      query: (params) => ({ url: "/selection", params }),
      providesTags: (result) =>
        result
          ? [...result.map((c) => ({ type: "Selection" as const, id: c.id })), { type: "Selection", id: "LIST" }]
          : [{ type: "Selection", id: "LIST" }],
    }),
    updateSelectionStatus: builder.mutation<
      SelectionCandidate,
      { id: string; status: SelectionCandidate["status"]; feedback?: string; phase?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/selection/${id}/status`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Selection", id }, { type: "Selection", id: "LIST" }],
    }),
    notifySelection: builder.mutation<{ notified: number }, { franchiseId: string; phase?: string; message?: string }>({
      query: (body) => ({ url: "/selection/notify", method: "POST", body }),
    }),
  }),
});

export const {
  useGetSelectionListQuery,
  useUpdateSelectionStatusMutation,
  useNotifySelectionMutation,
} = selectionApi;
