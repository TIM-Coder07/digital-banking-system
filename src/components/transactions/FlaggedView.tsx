"use client";

import { useState } from "react";
import { ShieldCheck, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { useFlagTransactionMutation, useGetTransactionsQuery } from "@/store/features/transactions/transactionApi";
import { useSetAccountStatusMutation } from "@/store/features/accounts/accountApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { label } from "@/lib/constants";
import { formatDate, formatMoney, groupAccount } from "@/lib/format";
import type { Transaction } from "@/types";

type Action = { txn: Transaction; kind: "CLEAR" | "FREEZE" } | null;

/** Admin queue of flagged transactions: clear the flag or freeze the source account. */
export function FlaggedView() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<Action>(null);
  const { data, isLoading, isFetching } = useGetTransactionsQuery({ flagged: true, page });
  const [flag, { isLoading: clearing }] = useFlagTransactionMutation();
  const [setStatus, { isLoading: freezing }] = useSetAccountStatusMutation();

  const onConfirm = async () => {
    if (!action) return;
    try {
      if (action.kind === "CLEAR") {
        await flag({ id: action.txn._id, flagged: false }).unwrap();
        toast.success("Flag cleared");
      } else if (action.txn.fromAccount) {
        await setStatus({ id: action.txn.fromAccount._id, status: "FROZEN" }).unwrap();
        toast.success("Source account frozen");
      }
      setAction(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data?.items.length) return <EmptyState title="Nothing flagged" description="Suspicious transactions flagged by staff or the rules engine show up here." />;

  return (
    <Card className={isFetching ? "opacity-60" : ""}>
      <ul className="divide-y divide-slate-100 dark:divide-white/5">
        {data.items.map((t) => (
          <li key={t._id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="num text-base font-semibold">{formatMoney(t.amount)}</span>
                <span className="text-sm text-slate-500">{label(t.type)}</span>
                <span className="font-mono text-xs text-slate-400">{t.txnId}</span>
              </div>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{t.flagReason ?? "Flagged"}</p>
              <p className="mt-1 text-xs text-slate-500">
                {t.fromAccount ? groupAccount(t.fromAccount.accountNumber) : "Bank"} → {t.toAccount ? groupAccount(t.toAccount.accountNumber) : "Bank"} · {formatDate(t.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setAction({ txn: t, kind: "CLEAR" })}>
                <ShieldCheck className="h-3.5 w-3.5" /> Clear flag
              </Button>
              {t.fromAccount && (
                <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => setAction({ txn: t, kind: "FREEZE" })}>
                  <Snowflake className="h-3.5 w-3.5" /> Freeze sender
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />

      <ConfirmDialog
        open={!!action}
        title={action?.kind === "CLEAR" ? "Clear this flag?" : "Freeze the sender's account?"}
        confirmLabel={action?.kind === "CLEAR" ? "Clear flag" : "Freeze account"}
        tone={action?.kind === "CLEAR" ? "primary" : "danger"}
        loading={clearing || freezing}
        onCancel={() => setAction(null)}
        onConfirm={onConfirm}
      >
        {action?.kind === "CLEAR"
          ? "The transaction looks legitimate and will leave the review queue."
          : "The account will not be able to send or receive money until an admin unfreezes it."}
      </ConfirmDialog>
    </Card>
  );
}