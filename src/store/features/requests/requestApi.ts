import { baseApi } from "@/store/api/baseApi";
import type { ApiResponse, FundRequest, Paginated } from "@/types";
import type { FundRequestValues, ReviewValues } from "@/lib/validations/request.schema";

export const requestApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getRequests: b.query<Paginated<FundRequest>, { status?: string; type?: string; page?: number } | void>({
      query: (params) => ({ url: "/requests", params: params ?? undefined }),
      transformResponse: (r: ApiResponse<Paginated<FundRequest>>) => r.data,
      providesTags: [{ type: "Request", id: "LIST" }],
    }),
    createRequest: b.mutation<FundRequest, FundRequestValues>({
      query: (body) => ({ url: "/requests", method: "POST", body }),
      transformResponse: (r: ApiResponse<FundRequest>) => r.data,
      invalidatesTags: [{ type: "Request", id: "LIST" }],
    }),
    reviewRequest: b.mutation<FundRequest, ReviewValues & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/requests/${id}/review`, method: "PATCH", body }),
      transformResponse: (r: ApiResponse<FundRequest>) => r.data,
      invalidatesTags: [{ type: "Request", id: "LIST" }, "Account", "Transaction", "Analytics"],
    }),
  }),
});

export const { useGetRequestsQuery, useCreateRequestMutation, useReviewRequestMutation } = requestApi;
