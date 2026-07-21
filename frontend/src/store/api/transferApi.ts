// src/store/api/transferApi.ts
import { baseApi } from "./baseApi";

export interface TransferListing {
  id: string;
  studentId: string;
  fromFranchiseId: string;
  fromFranchise?: { id: string; name: string };
  fromManagerId: string;
  price: number;
  currency: string;
  note?: string;
  skills: string[];
  highlights: string[];
  overallRating: number;
  isPublic: boolean;
  isActive: boolean;
  expiresAt?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    position?: string;
    ageGroup: string;
    photo?: string;
    overallRating: number;
    attendancePercentage?: number;
  };
}

export interface TransferRequest {
  id: string;
  listingId: string;
  studentId: string;
  fromFranchiseId: string;
  fromManagerId: string;
  toManagerId: string;
  offeredPrice: number;
  currency: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message?: string;
  responseNote?: string;
  respondedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListPlayerBody {
  price: number;
  currency?: string;
  note?: string;
  skills?: string[];
  highlights?: string[];
  isPublic?: boolean;
  expiresAt?: string;
}

export const transferApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransferListings: builder.query<
      { data: TransferListing[]; meta: { total: number; page: number; limit: number; totalPages: number } },
      { page?: number; limit?: number; search?: string; minRating?: number; maxPrice?: number; position?: string; ageGroup?: string }
    >({
      query: (params) => ({ url: "/transfer-wall", params }),
      providesTags: (result) =>
        result
          ? [...result.data.map((l) => ({ type: "Transfer" as const, id: l.id })), { type: "Transfer", id: "LIST" }]
          : [{ type: "Transfer", id: "LIST" }],
    }),
    getListingById: builder.query<TransferListing, string>({
      query: (id) => `/transfer-wall/${id}`,
      transformResponse: (res: { data: TransferListing }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Transfer", id }],
    }),
    listPlayer: builder.mutation<TransferListing, { studentId: string; data: ListPlayerBody }>({
      query: ({ studentId, data }) => ({
        url: `/transfer-wall/students/${studentId}/list`,
        method: "POST",
        body: data,
      }),
      transformResponse: (res: { data: TransferListing }) => res.data,
      invalidatesTags: [{ type: "Transfer", id: "LIST" }, "Student"],
    }),
    updateListing: builder.mutation<TransferListing, { id: string; data: Partial<ListPlayerBody> }>({
      query: ({ id, data }) => ({ url: `/transfer-wall/${id}`, method: "PUT", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Transfer", id }, { type: "Transfer", id: "LIST" }],
    }),
    removeListing: builder.mutation<void, string>({
      query: (id) => ({ url: `/transfer-wall/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Transfer", id }, { type: "Transfer", id: "LIST" }, "Student"],
    }),
    requestTransfer: builder.mutation<TransferRequest, { listingId: string; offeredPrice: number; message?: string }>({
      query: (body) => ({ url: "/transfer-wall/request", method: "POST", body }),
      invalidatesTags: ["Transfer"],
    }),
    respondToTransfer: builder.mutation<TransferRequest, { requestId: string; action: "accept" | "reject"; responseNote?: string }>({
      query: ({ requestId, ...body }) => ({
        url: `/transfer-wall/requests/${requestId}/respond`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Transfer", "Student"],
    }),
    getMyListings: builder.query<
      { data: TransferListing[]; meta: { total: number; page: number; limit: number; totalPages: number } },
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({ url: "/transfer-wall/my/listings", params: params ?? {} }),
      providesTags: [{ type: "Transfer", id: "LIST" }],
    }),
    getIncomingRequests: builder.query<TransferRequest[], void>({
      query: () => "/transfer-wall/my/requests/incoming",
      transformResponse: (res: { data: TransferRequest[] }) => res.data,
      providesTags: ["Transfer"],
    }),
    getOutgoingRequests: builder.query<TransferRequest[], void>({
      query: () => "/transfer-wall/my/requests/outgoing",
      transformResponse: (res: { data: TransferRequest[] }) => res.data,
      providesTags: ["Transfer"],
    }),
  }),
});

export const {
  useGetTransferListingsQuery,
  useGetListingByIdQuery,
  useListPlayerMutation,
  useUpdateListingMutation,
  useRemoveListingMutation,
  useRequestTransferMutation,
  useRespondToTransferMutation,
  useGetMyListingsQuery,
  useGetIncomingRequestsQuery,
  useGetOutgoingRequestsQuery,
} = transferApi;
