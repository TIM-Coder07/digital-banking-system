import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Role } from "@/lib/constants";

export type SessionUser = { id: string; name: string; email: string; role: Role };

type AuthState = {
  user: SessionUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

const initialState: AuthState = { user: null, status: "loading" };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<SessionUser | null>) {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "unauthenticated";
    },
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
