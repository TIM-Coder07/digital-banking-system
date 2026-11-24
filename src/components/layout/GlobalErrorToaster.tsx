"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearError } from "@/store/features/ui/uiSlice";

/** Shows the centralized Redux error state as a toast. */
export function GlobalErrorToaster() {
  const err = useAppSelector((s) => s.ui.lastError);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!err) return;
    toast.error(err.message);
    dispatch(clearError());
  }, [err, dispatch]);
  return null;
}
