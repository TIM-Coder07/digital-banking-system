import { baseApi } from "@/store/api/baseApi";
import type { Account, ApiResponse, Paginated } from "@/types";
import type { AccountStatus, AccountType } from "@/lib/constants";

type AccountQuery = { q?: string; status?: string; type?: string; ownerId?: string; page?: number; limit?: number } | void;

export const accountApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAccounts: b.query<Paginated<Account>, AccountQuery>({
      query: (params) => ({ url: "/accounts", params: params ?? undefined }),
      transformResponse: (r: ApiResponse<Paginated<Account>>) => r.data,
      providesTags: (res) => [
        { type: "Account", id: "LIST" },
        ...(res?.items.map((a) => ({ type: "Account" as const, id: a._id })) ?? []),
      ],
    }),
    getAccount: b.query<Account, string>({
      query: (id) => `/accounts/${id}`,
      transformResponse: (r: ApiResponse<Account>) => r.data,
      providesTags: (_r, _e, id) => [{ type: "Account", id }],
    }),
    createAccount: b.mutation<Account, { ownerId: string; type: AccountType }>({
      query: (body) => ({ url: "/accounts", method: "POST", body }),
      transformResponse: (r: ApiResponse<Account>) => r.data,
      invalidatesTags: [{ type: "Account", id: "LIST" }, "Customer", "Analytics"],
    }),
    setAccountStatus: b.mutation<Account, { id: string; status: AccountStatus }>({
      query: ({ id, status }) => ({ url: `/accounts/${id}/status`, method: "PATCH", body: { status } }),
      transformResponse: (r: ApiResponse<Account>) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Account", id }, { type: "Account", id: "LIST" }],
    }),
    setAccountLimits: b.mutation<
      Account,
      { id: string; dailyTransferLimit?: number | null; singleTransactionLimit?: number | null; minimumBalance?: number | null }
    >({
      query: ({ id, ...body }) => ({ url: `/accounts/${id}/limits`, method: "PATCH", body }),
      transformResponse: (r: ApiResponse<Account>) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Account", id }],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useGetAccountQuery,
  useCreateAccountMutation,
  useSetAccountStatusMutation,
  useSetAccountLimitsMutation,
} = accountApi;
