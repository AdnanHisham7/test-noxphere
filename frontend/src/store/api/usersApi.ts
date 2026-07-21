// src/store/api/usersApi.ts
import { baseApi } from "./baseApi";

export type UserRole = "super_admin" | "manager" | "coach" | "student" | "guardian";

export interface ManagedUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  franchiseId?: string;
  permissions: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  data: ManagedUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<
      PaginatedUsers,
      { roles?: string; franchiseId?: string; isActive?: string; search?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/users", params }),
      providesTags: (result) =>
        result
          ? [...result.data.map((u) => ({ type: "User" as const, id: u.id })), { type: "User", id: "LIST" }]
          : [{ type: "User", id: "LIST" }],
    }),
    getUserById: builder.query<ManagedUser, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),
    createUser: builder.mutation<
      ManagedUser,
      { email: string; password: string; role: UserRole; firstName: string; lastName: string; phone?: string; franchiseId?: string }
    >({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    updateUser: builder.mutation<ManagedUser, { id: string; data: Partial<ManagedUser> }>({
      query: ({ id, data }) => ({ url: `/users/${id}`, method: "PUT", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),
    toggleUserActive: builder.mutation<ManagedUser, string>({
      query: (id) => ({ url: `/users/${id}/toggle-active`, method: "PATCH" }),
      invalidatesTags: (_r, _e, id) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),
    resetUserPassword: builder.mutation<ManagedUser, { id: string; newPassword: string }>({
      query: ({ id, newPassword }) => ({ url: `/users/${id}/reset-password`, method: "PATCH", body: { newPassword } }),
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useToggleUserActiveMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
} = usersApi;
