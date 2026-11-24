import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * Single RTK Query API. Each feature adds its endpoints with injectEndpoints,
 * so caching and tag invalidation work across features.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "same-origin" }),
  tagTypes: ["Account", "Transaction", "Request", "Loan", "Customer", "Analytics", "Notification", "Settings"],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});

/** Pulls the server message out of an RTK Query error. */
export function apiErrorMessage(err: unknown, fallback = "Something went wrong") {
  if (typeof err === "object" && err && "data" in err) {
    const data = (err as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }
  return fallback;
}
