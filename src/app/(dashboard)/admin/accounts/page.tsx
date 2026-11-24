"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useGetAccountsQuery } from "@/store/features/accounts/accountApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { fieldClass } from "@/components/ui/Input";
import { ACCOUNT_STATUS, ACCOUNT_TYPES, label } from "@/lib/constants";
import { formatDay, formatMoney, groupAccount } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AdminAccountsPage() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(input.replace(/\s/g, ""));
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, isFetching } = useGetAccountsQuery({ q, type, status, page });

  return (
    <>
      <PageHeader title="Accounts" description="Every bank account. Open one from a customer's page." />
      <Card className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Account number" inputMode="numeric" className={cn(fieldClass, "pl-9")} />
          </div>
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className={fieldClass} aria-label="Type">
            <option value="">All types</option>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>{label(t)}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={fieldClass} aria-label="Status">
            <option value="">All statuses</option>
            {ACCOUNT_STATUS.map((s) => (
              <option key={s} value={s}>{label(s)}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <Skeleton className="h-64" />
        ) : !data?.items.length ? (
          <EmptyState title="No accounts found" />
        ) : (
          <div className={isFetching ? "opacity-60" : ""}>
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/5">
                    <th className="px-5 py-3 font-medium">Account</th>
                    <th className="px-5 py-3 font-medium">Owner</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 text-right font-medium">Balance</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Opened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {data.items.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <Link href={`/admin/accounts/${a._id}`} className="font-mono font-medium hover:text-brand-600 hover:underline">
                          {groupAccount(a.accountNumber)}
                        </Link>
                      </td>
                      <td className="px-5 py-3">{typeof a.owner === "object" ? a.owner.name : "-"}</td>
                      <td className="px-5 py-3 text-slate-500">{label(a.type)}</td>
                      <td className="num px-5 py-3 text-right font-semibold">{formatMoney(a.balance)}</td>
                      <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDay(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
          </div>
        )}
      </Card>
    </>
  );
}