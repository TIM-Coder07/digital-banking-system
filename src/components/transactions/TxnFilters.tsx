"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetTxnFilters, setTxnFilter } from "@/store/features/transactions/transactionSlice";
import { TXN_TYPES, label, type TxnType } from "@/lib/constants";
import { fieldClass } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function TxnFilters() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.transaction.filters);
  const [q, setQ] = useState(filters.q);

  // debounce the ID search
  useEffect(() => {
    const t = setTimeout(() => q !== filters.q && dispatch(setTxnFilter({ q })), 350);
    return () => clearTimeout(t);
  }, [q, filters.q, dispatch]);

  const active = filters.q || filters.type || filters.from || filters.to;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_160px_160px_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by transaction ID" className={cn(fieldClass, "pl-9")} />
      </div>
      <select value={filters.type} onChange={(e) => dispatch(setTxnFilter({ type: e.target.value as TxnType | "" }))} className={fieldClass} aria-label="Type">
        <option value="">All types</option>
        {TXN_TYPES.map((t) => (
          <option key={t} value={t}>
            {label(t)}
          </option>
        ))}
      </select>
      <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => dispatch(setTxnFilter({ from: e.target.value }))} className={fieldClass} aria-label="From date" />
      <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => dispatch(setTxnFilter({ to: e.target.value }))} className={fieldClass} aria-label="To date" />
      {active ? (
        <Button
          variant="ghost"
          onClick={() => {
            setQ("");
            dispatch(resetTxnFilters());
          }}
        >
          <X className="h-4 w-4" /> Clear
        </Button>
      ) : (
        <span className="hidden lg:block" />
      )}
    </div>
  );
}
