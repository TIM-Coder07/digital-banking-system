"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Flag, ShieldAlert } from "lucide-react";
import type { Transaction } from "@/types";
import { label } from "@/lib/constants";
import { formatDate, formatMoney, maskAccount } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type Props = { items: Transaction[]; ownAccountIds?: string[]; detailBase?: string; onFlag?: (t: Transaction) => void };

export function TxnTable({ items, ownAccountIds, detailBase, onFlag }: Props) {
  const isOut = (t: Transaction) =>
    !!ownAccountIds && !!t.fromAccount && ownAccountIds.includes(t.fromAccount._id) && !(t.toAccount && ownAccountIds.includes(t.toAccount._id));
  const party = (t: Transaction) => {
    if (!ownAccountIds) {
      const from = t.fromAccount ? maskAccount(t.fromAccount.accountNumber) : "Bank";
      const to = t.toAccount ? maskAccount(t.toAccount.accountNumber) : "Bank";
      return `${from} → ${to}`;
    }
    const a = isOut(t) ? t.toAccount : t.fromAccount ?? t.toAccount;
    return a ? maskAccount(a.accountNumber) : "Bank";
  };

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/5">
            <th className="px-5 py-3 font-medium">Transaction</th>
            <th className="px-5 py-3 font-medium">Account</th>
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Amount</th>
            {onFlag && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {items.map((t) => {
            const out = isOut(t) || (!ownAccountIds && (t.type === "WITHDRAWAL" || t.type === "LOAN_REPAYMENT"));
            const Icon = out ? ArrowUpRight : ArrowDownLeft;
            return (
              <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", out ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10")}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      {detailBase ? (
                        <Link href={`${detailBase}/${t._id}`} className="font-medium text-slate-800 hover:text-brand-600 hover:underline dark:text-slate-100">
                          {t.description || label(t.type)}
                        </Link>
                      ) : (
                        <p className="font-medium text-slate-800 dark:text-slate-100">{t.description || label(t.type)}</p>
                      )}
                      <p className="font-mono text-xs text-slate-400">{t.txnId}</p>
                    </div>
                    {t.flagged && (
                      <span title={t.flagReason}>
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-slate-500">{party(t)}</td>
                <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className={cn("num whitespace-nowrap px-5 py-3 text-right font-semibold", out ? "text-slate-900 dark:text-white" : "text-emerald-600")}>
                  {ownAccountIds ? (out ? "−" : "+") : ""}
                  {formatMoney(t.amount)}
                  {t.fee > 0 && <span className="block text-xs font-normal text-slate-400">fee {formatMoney(t.fee)}</span>}
                </td>
                {onFlag && (
                  <td className="px-5 py-3 text-right">
                    {!t.flagged && (
                      <button onClick={() => onFlag(t)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10">
                        <Flag className="h-3.5 w-3.5" /> Flag
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}