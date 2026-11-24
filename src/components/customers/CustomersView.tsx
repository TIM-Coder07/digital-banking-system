"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { useGetCustomersQuery } from "@/store/features/customers/customerApi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { fieldClass } from "@/components/ui/Input";
import { USER_STATUS, label } from "@/lib/constants";
import { formatDay } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Shared by staff and admin. */
export function CustomersView({ basePath, registerHref }: { basePath: string; registerHref?: string }) {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(input.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, isFetching } = useGetCustomersQuery({ q, status, page });

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search name, email, phone or national ID" className={cn(fieldClass, "pl-9")} />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={cn(fieldClass, "sm:w-44")}
          aria-label="Status"
        >
          <option value="">All statuses</option>
          {USER_STATUS.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        {registerHref && (
          <Link href={registerHref}>
            <Button className="w-full">
              <UserPlus className="h-4 w-4" /> Register customer
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !data?.items.length ? (
        <EmptyState title="No customers found" />
      ) : (
        <div className={isFetching ? "opacity-60" : ""}>
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/5">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">KYC</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {data.items.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <Link href={`${basePath}/${c._id}`} className="font-medium text-slate-800 hover:text-brand-600 hover:underline dark:text-slate-100">
                        {c.name}
                      </Link>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{c.phone ?? "-"}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.isVerified ? "APPROVED" : "PENDING"} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDay(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
        </div>
      )}
    </Card>
  );
}