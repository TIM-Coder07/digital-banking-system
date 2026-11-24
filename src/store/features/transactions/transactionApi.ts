import { baseApi } from "@/store/api/baseApi";
import type { ApiResponse, Paginated, Transaction } from "@/types";
import type { TransferValues } from "@/lib/validations/transfer.schema";

type TxnQuery = {
  q?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  accountId?: string;
  flagged?: boolean;
  page?: number;
  limit?: number;
};

const clean = (p: TxnQuery) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== "" && v !== undefined && v !== false));

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getTransactions: b.query<Paginated<Transaction>, TxnQuery>({
      query: (params) => ({ url: "/transactions", params: clean(params) }),
      transformResponse: (r: ApiResponse<Paginated<Transaction>>) => r.data,
      providesTags: [{ type: "Transaction", id: "LIST" }],
    }),
    getTransaction: b.query<Transaction, string>({
      query: (id) => `/transactions/${id}`,
      transformResponse: (r: ApiResponse<Transaction>) => r.data,
      providesTags: (_r, _e, id) => [{ type: "Transaction", id }],
    }),
    transfer: b.mutation<Transaction, TransferValues & { idempotencyKey: string }>({
      query: ({ idempotencyKey, ...body }) => ({
        url: "/transfers",
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse: (r: ApiResponse<Transaction>) => r.data,
      // balances, history, charts and notifications all refresh
      invalidatesTags: [{ type: "Transaction", id: "LIST" }, "Account", "Analytics", "Notification"],
    }),
    flagTransaction: b.mutation<Transaction, { id: string; flagged: boolean; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/transactions/${id}/flag`, method: "PATCH", body }),
      transformResponse: (r: ApiResponse<Transaction>) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Transaction", id }, { type: "Transaction", id: "LIST" }],
    }),
  }),
});

export const { useGetTransactionsQuery, useGetTransactionQuery, useTransferMutation, useFlagTransactionMutation } =
  transactionApi;
