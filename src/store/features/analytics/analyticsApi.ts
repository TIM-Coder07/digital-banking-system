import { baseApi } from "@/store/api/baseApi";
import type { AdminAnalytics, ApiResponse, CustomerAnalytics } from "@/types";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAdminAnalytics: b.query<AdminAnalytics, void>({
      query: () => "/analytics/admin",
      transformResponse: (r: ApiResponse<AdminAnalytics>) => r.data,
      providesTags: ["Analytics"],
    }),
    getCustomerAnalytics: b.query<CustomerAnalytics, string | null>({
      query: (accountId) => ({ url: "/analytics/customer", params: accountId ? { accountId } : undefined }),
      transformResponse: (r: ApiResponse<CustomerAnalytics>) => r.data,
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetAdminAnalyticsQuery, useGetCustomerAnalyticsQuery } = analyticsApi;
