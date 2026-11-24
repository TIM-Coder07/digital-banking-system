"use client";

import { useEffect, type ReactNode } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import StoreProvider from "@/store/Provider";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/features/auth/authSlice";
import { baseApi } from "@/store/api/baseApi";
import { GlobalErrorToaster } from "@/components/layout/GlobalErrorToaster";

/** Mirrors the NextAuth session into Redux (auth slice). Clears API cache on sign out. */
function AuthSync() {
  const { data, status } = useSession();
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (status === "loading") return;
    if (data?.user) {
      dispatch(setUser({ id: data.user.id, name: data.user.name ?? "", email: data.user.email ?? "", role: data.user.role }));
    } else {
      dispatch(setUser(null));
      dispatch(baseApi.util.resetApiState());
    }
  }, [data, status, dispatch]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <StoreProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthSync />
          <GlobalErrorToaster />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </StoreProvider>
    </SessionProvider>
  );
}
