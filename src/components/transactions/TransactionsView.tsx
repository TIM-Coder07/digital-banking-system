"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { fieldClass } from "@/components/ui/Input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTxnFilter } from "@/store/features/transactions/transactionSlice";
import { useFlagTransactionMutation, useGetTransactionsQuery } from "@/store/features/transactions/transactionApi";
import { useGetAccountsQuery } from "@/store/features/accounts/accountApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/types";
import { TxnFilters } from "./TxnFilters";
import { TxnTable } from "./TxnTable";

type Props = { detailBase?: string; flaggedOnly?: boolean; accountId?: string; allowFlag?: boolean };

/** Shared by customer, staff and admin. The API decides what each role may see. */
export function TransactionsView({ detailBase, flaggedOnly, accountId, allowFlag }: Props) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.transaction.filters);
  const role = useAppSelector((s) => s.auth.user?.role);
  const isCustomer = role === "CUSTOMER";
  const [flagTarget, setFlagTarget] = useState<Transaction | null>(null);
  const [reason, setReason] = useState("");

  const { data: accounts } = useGetAccountsQuery(undefined, { skip: !isCustomer });
  const { data, isLoading, isFetching } = useGetTransactionsQuery({ ...filters, flagged: flaggedOnly, accountId });
  const [flag, { isLoading: flagging }] = useFlagTransactionMutation();

  const onFlag = async () => {
    if (!flagTarget) return;
    try {
      await flag({ id: flagTarget._id, flagged: true, reason: reason.trim() || undefined }).unwrap();
      toast.success("Flagged for admin review");
      setFlagTarget(null);
      setReason("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Card className="space-y-4">
      <TxnFilters />
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState title="No transactions found" description="Try changing the filters or date range." />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
          <TxnTable
            items={data.items}
            detailBase={detailBase}
            ownAccountIds={isCustomer ? accounts?.items.map((a) => a._id) : undefined}
            onFlag={allowFlag && !isCustomer ? setFlagTarget : undefined}
          />
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={(page) => dispatch(setTxnFilter({ page }))} />
        </div>
      )}

      <ConfirmDialog
        open={!!flagTarget}
        title="Flag for admin review?"
        confirmLabel="Flag"
        tone="danger"
        loading={flagging}
        onCancel={() => {
          setFlagTarget(null);
          setReason("");
        }}
        onConfirm={onFlag}
      >
        {flagTarget && (
          <div className="space-y-3">
            <p>
              <span className="font-mono">{flagTarget.txnId}</span> · {formatMoney(flagTarget.amount)}
            </p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Why is this suspicious?" className={fieldClass} />
          </div>
        )}
      </ConfirmDialog>
    </Card>
  );
}