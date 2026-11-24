"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { useGetAccountQuery } from "@/store/features/accounts/accountApi";
import { Card, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { AccountCard } from "@/components/accounts/AccountCard";
import { TransactionsView } from "@/components/transactions/TransactionsView";
import { fieldClass } from "@/components/ui/Input";
import { label } from "@/lib/constants";
import { formatDay, groupAccount } from "@/lib/format";

export default function CustomerAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: account, isLoading } = useGetAccountQuery(id);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  if (isLoading) return <Skeleton className="h-52 max-w-md rounded-2xl" />;
  if (!account) return <p className="text-sm text-slate-500">Account not found.</p>;

  const qs = new URLSearchParams({ ...(from && { from }), ...(to && { to }) }).toString();
  const rows: [string, string][] = [
    ["Account number", groupAccount(account.accountNumber)],
    ["Account type", label(account.type)],
    ["Status", label(account.status)],
    ["Opened", formatDay(account.createdAt)],
  ];

  return (
    <>
      <Link href="/customer/accounts" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> My accounts
      </Link>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <AccountCard account={account} />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardTitle>Account details</CardTitle>
            <dl className="divide-y divide-slate-100 text-sm dark:divide-white/5">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <CardTitle>Download statement</CardTitle>
            <div className="space-y-3">
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={fieldClass} aria-label="From" />
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={fieldClass} aria-label="To" />
              <a
                href={`/api/accounts/${account._id}/statement${qs ? `?${qs}` : ""}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                <Download className="h-4 w-4" /> Download CSV
              </a>
              <p className="text-xs text-slate-500">Leave dates empty for the full history.</p>
            </div>
          </Card>
        </div>
      </div>

      <TransactionsView accountId={account._id} detailBase="/customer/transactions" />
    </>
  );
}