import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import authReducer from "./features/auth/authSlice";
import accountReducer from "./features/accounts/accountSlice";
import transactionReducer from "./features/transactions/transactionSlice";
import loanReducer from "./features/loans/loanSlice";
import uiReducer from "./features/ui/uiSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authReducer,
      account: accountReducer,
      transaction: transactionReducer,
      loan: loanReducer,
      ui: uiReducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
