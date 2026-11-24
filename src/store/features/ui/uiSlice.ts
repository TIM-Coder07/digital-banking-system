import { createSlice, isFulfilled, isPending, isRejected, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Centralized loading and error state. Every async thunk and RTK Query
 * request passes through these matchers, so the top progress bar and the
 * global error toast work without per-component wiring.
 */
type UiState = {
  pendingCount: number;
  lastError: { message: string; at: number } | null;
  sidebarOpen: boolean;
};

const initialState: UiState = { pendingCount: 0, lastError: null, sidebarOpen: false };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    clearError(state) {
      state.lastError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(isPending, (state) => {
        state.pendingCount += 1;
      })
      .addMatcher(isFulfilled, (state) => {
        state.pendingCount = Math.max(0, state.pendingCount - 1);
      })
      .addMatcher(isRejected, (state, action) => {
        state.pendingCount = Math.max(0, state.pendingCount - 1);
        if (action.meta.condition || action.meta.aborted) return;
        const payload = action.payload as { status?: number; data?: { message?: string } } | undefined;
        const message = payload?.data?.message ?? action.error?.message;
        // Queries surface errors globally. Mutations show their own inline error.
        // 401 is handled by the auth flow, not shown as a toast.
        const isQuery = action.type.startsWith("api/executeQuery");
        if (isQuery && message && payload?.status !== 401) state.lastError = { message, at: Date.now() };
      });
  },
});

export const { setSidebarOpen, clearError } = uiSlice.actions;
export default uiSlice.reducer;
