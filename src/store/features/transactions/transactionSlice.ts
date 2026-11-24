import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TxnType } from "@/lib/constants";

export type TxnFilters = {
  q: string;
  type: TxnType | "";
  from: string;
  to: string;
  page: number;
};

const initialState: { filters: TxnFilters } = {
  filters: { q: "", type: "", from: "", to: "", page: 1 },
};

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    setTxnFilter(state, action: PayloadAction<Partial<TxnFilters>>) {
      // any filter change except page resets to page 1
      const resetPage = !("page" in action.payload);
      state.filters = { ...state.filters, ...action.payload, ...(resetPage ? { page: 1 } : {}) };
    },
    resetTxnFilters(state) {
      state.filters = initialState.filters;
    },
  },
});

export const { setTxnFilter, resetTxnFilters } = transactionSlice.actions;
export default transactionSlice.reducer;
