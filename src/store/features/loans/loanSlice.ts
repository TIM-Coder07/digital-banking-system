import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LoanStatus } from "@/lib/constants";

type LoanState = { selectedLoanId: string | null; statusFilter: LoanStatus | "" };

const initialState: LoanState = { selectedLoanId: null, statusFilter: "" };

const loanSlice = createSlice({
  name: "loan",
  initialState,
  reducers: {
    selectLoan(state, action: PayloadAction<string | null>) {
      state.selectedLoanId = action.payload;
    },
    setLoanStatusFilter(state, action: PayloadAction<LoanStatus | "">) {
      state.statusFilter = action.payload;
    },
  },
});

export const { selectLoan, setLoanStatusFilter } = loanSlice.actions;
export default loanSlice.reducer;
