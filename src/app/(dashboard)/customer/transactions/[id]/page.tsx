"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { useGetTransactionQuery } from "@/store/features/transactions/transactionApi";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/Badge";
import { label } from "@/lib/constants";
import { formatDate, formatMoney, groupAccount } from "@/lib/format";

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: t, isLoading } = useGetTransactionQuery(id);

  if (isLoading) return <Skeleton className="h-96 max-w-xl" />;
  if (!t) return <p className="text-sm text-slate-500">Transaction not found.</p>;

  const rows: [string, string][] = [
    ["Reference", t.txnId],
    ["Type", label(t.type)],
    ["Date", formatDate(t.createdAt)],
    ["From", t.fromAccount ? groupAccount(t.fromAccount.accountNumber) : "Bank"],
    ["To", t.toAccount ? groupAccount(t.toAccount.accountNumber) : "Bank"],
    ["Fee", formatMoney(t.fee)],
    ["Description", t.description || "-"],
  ];

  return (
    <div className="max-w-xl space-y-4">
      <Link href="/customer/transactions" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Transactions
      </Link>
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Amount</p>
            <p className="num mt-1 text-3xl font-semibold">{formatMoney(t.amount)}</p>
          </div>
          <StatusBadge status={t.status} />
        </div>
        <dl className="mt-6 divide-y divide-slate-100 text-sm dark:divide-white/5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <a
          href={`/api/transactions/${t._id}/receipt`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          <Download className="h-4 w-4" /> Download PDF receipt
        </a>
      </Card>
    </div>
  );
}
