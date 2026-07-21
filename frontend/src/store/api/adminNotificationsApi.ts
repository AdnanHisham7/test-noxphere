// src/store/api/adminNotificationsApi.ts
import { baseApi } from "./baseApi";

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  audience: "all" | "guardians" | "coaches" | "students" | "team";
  createdAt: string;
  readBy: string[];
}

export interface CreateNotificationBody {
  franchiseId: string;
  title: string;
  body: string;
  audience: AdminNotification["audience"];
  teamId?: string;
}

export interface NotificationListResult {
  items: AdminNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminNotificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<NotificationListResult, { franchiseId: string; page?: number }>({
      query: (params) => ({ url: "/notifications", params }),
      transformResponse: (res: { data: NotificationListResult }) => res.data,
      providesTags: ["Notification"],
    }),
    createNotification: builder.mutation<AdminNotification, CreateNotificationBody>({
      query: (body) => ({ url: "/notifications", method: "POST", body }),
      transformResponse: (res: { data: AdminNotification }) => res.data,
      invalidatesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation<AdminNotification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      transformResponse: (res: { data: AdminNotification }) => res.data,
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useCreateNotificationMutation,
  useMarkNotificationReadMutation,
} = adminNotificationsApi;
