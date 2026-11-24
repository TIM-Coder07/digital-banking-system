import { baseApi } from "@/store/api/baseApi";
import type { ApiResponse, Loan, LoanNote, LoanRepayment, Paginated } from "@/types";
import type { ApplyLoanValues, RepayValues } from "@/lib/validations/loan.schema";

type LoanDetail = { loan: Loan; repayments: LoanRepayment[]; notes: LoanNote[] };

export const loanApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getLoans: b.query<Paginated<Loan>, { status?: string; page?: number } | void>({
      query: (params) => ({ url: "/loans", params: params ?? undefined }),
      transformResponse: (r: ApiResponse<Paginated<Loan>>) => r.data,
      providesTags: [{ type: "Loan", id: "LIST" }],
    }),
    getLoan: b.query<LoanDetail, string>({
      query: (id) => `/loans/${id}`,
      transformResponse: (r: ApiResponse<LoanDetail>) => r.data,
      providesTags: (_r, _e, id) => [{ type: "Loan", id }],
    }),
    applyLoan: b.mutation<Loan, ApplyLoanValues>({
      query: (body) => ({ url: "/loans", method: "POST", body }),
      transformResponse: (r: ApiResponse<Loan>) => r.data,
      invalidatesTags: [{ type: "Loan", id: "LIST" }],
    }),
    addLoanNote: b.mutation<LoanNote, { id: string; note: string }>({
      query: ({ id, note }) => ({ url: `/loans/${id}/notes`, method: "POST", body: { note } }),
      transformResponse: (r: ApiResponse<LoanNote>) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Loan", id }],
    }),
    forwardLoan: b.mutation<Loan, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/loans/${id}/forward`, method: "PATCH", body: { note } }),
      transformResponse: (r: ApiResponse<Loan>) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Loan", id }, { type: "Loan", id: "LIST" }],
    }),
    decideLoan: b.mutation<Loan, { id: string; decision: "APPROVE" | "REJECT"; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/loans/${id}/decision`, method: "PATCH", body }),
      transformResponse: (r: ApiResponse<Loan>) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Loan", id }, { type: "Loan", id: "LIST" }, "Account", "Transaction", "Analytics"],
    }),
    repayLoan: b.mutation<{ loan: Loan; txnId: string }, RepayValues & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/loans/${id}/repay`, method: "POST", body }),
      transformResponse: (r: ApiResponse<{ loan: Loan; txnId: string }>) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Loan", id }, { type: "Loan", id: "LIST" }, "Account", "Transaction", "Analytics", "Notification"],
    }),
  }),
});

export const {
  useGetLoansQuery,
  useGetLoanQuery,
  useApplyLoanMutation,
  useAddLoanNoteMutation,
  useForwardLoanMutation,
  useDecideLoanMutation,
  useRepayLoanMutation,
} = loanApi;
