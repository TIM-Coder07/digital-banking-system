import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AccountState = { selectedAccountId: string | null };

const initialState: AccountState = { selectedAccountId: null };

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    selectAccount(state, action: PayloadAction<string | null>) {
      state.selectedAccountId = action.payload;
    },
  },
});

export const { selectAccount } = accountSlice.actions;
export default accountSlice.reducer;
