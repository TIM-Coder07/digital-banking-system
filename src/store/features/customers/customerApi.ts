import { baseApi } from "@/store/api/baseApi";
import type { Account, ApiResponse, Paginated, UserSummary } from "@/types";
import type { RegisterCustomerInput } from "@/lib/validations/auth.schema";
import type { UserStatus } from "@/lib/constants";

type CustomerDetail = UserSummary & { accounts: Account[]; transactionCount: number };

export const customerApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCustomers: b.query<Paginated<UserSummary>, { q?: string; status?: string; page?: number } | void>({
      query: (params) => ({ url: "/customers", params: params ?? undefined }),
      transformResponse: (r: ApiResponse<Paginated<UserSummary>>) => r.data,
      providesTags: [{ type: "Customer", id: "LIST" }],
    }),
    getCustomer: b.query<CustomerDetail, string>({
      query: (id) => `/customers/${id}`,
      transformResponse: (r: ApiResponse<CustomerDetail>) => r.data,
      providesTags: (_r, _e, id) => [{ type: "Customer", id }],
    }),
    createCustomer: b.mutation<{ _id: string }, RegisterCustomerInput>({
      query: (body) => ({ url: "/customers", method: "POST", body }),
      transformResponse: (r: ApiResponse<{ _id: string }>) => r.data,
      invalidatesTags: [{ type: "Customer", id: "LIST" }, "Analytics"],
    }),
    setCustomerStatus: b.mutation<UserSummary, { id: string; status: UserStatus }>({
      query: ({ id, status }) => ({ url: `/customers/${id}`, method: "PATCH", body: { status } }),
      transformResponse: (r: ApiResponse<UserSummary>) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Customer", id }, { type: "Customer", id: "LIST" }, "Account"],
    }),
    verifyCustomer: b.mutation<UserSummary, string>({
      query: (id) => ({ url: `/customers/${id}/verify`, method: "PATCH" }),
      transformResponse: (r: ApiResponse<UserSummary>) => r.data,
      invalidatesTags: (_r, _e, id) => [{ type: "Customer", id }, { type: "Customer", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useSetCustomerStatusMutation,
  useVerifyCustomerMutation,
} = customerApi;
