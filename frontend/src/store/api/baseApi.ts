// src/store/api/baseApi.ts
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../index";
import { clearCredentials, updateAccessToken } from "../slices/authSlice";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Wrap the base query so an expired access token (401) triggers a single
// silent refresh-and-retry using the stored refresh token. If the refresh
// itself fails, credentials are cleared so ProtectedRoute redirects to
// /login instead of the app hanging on silently-failing requests.
let refreshPromise: Promise<string | null> | null = null;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (!refreshToken) {
      api.dispatch(clearCredentials());
      return result;
    }

    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshResult = await rawBaseQuery(
          { url: "/auth/refresh", method: "POST", body: { refreshToken } },
          api,
          extraOptions,
        );
        const data = (refreshResult.data as { data?: { accessToken: string; refreshToken: string } })
          ?.data;
        if (data?.accessToken) {
          api.dispatch(updateAccessToken(data.accessToken));
          return data.accessToken;
        }
        api.dispatch(clearCredentials());
        return null;
      })().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;
    if (newAccessToken) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Academy",
    "Franchise",
    "Student",
    "Team",
    "Attendance",
    "Performance",
    "Fee",
    "Transfer",
    "Notification",
    "Selection",
    "Schedule",
    "Dashboard",
    "Finance",
    "Resource",
  ],
  endpoints: () => ({}),
});