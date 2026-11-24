"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Snowflake, Sun, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useGetAccountQuery, useSetAccountLimitsMutation, useSetAccountStatusMutation } from "@/store/features/accounts/accountApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AccountCard } from "@/components/accounts/AccountCard";
import { TransactionsView } from "@/components/transactions/TransactionsView";
import type { AccountStatus } from "@/lib/constants";

const toTaka = (p?: number | null) => (p == null ? "" : String(p / 100));
const toBody = (v: string) => (v.trim() === "" ? null : Number(v));

export default function AdminAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: account, isLoading } = useGetAccountQuery(id);
  const [setStatus, { isLoading: savingStatus }] = useSetAccountStatusMutation();
  const [setLimits, { isLoading: savingLimits }] = useSetAccountLimitsMutation();
  const [pending, setPending] = useState<AccountStatus | null>(null);
  const [limits, setLimitsForm] = useState({ daily: "", single: "", min: "" });

  useEffect(() => {
    if (account) {
      setLimitsForm({
        daily: toTaka(account.dailyTransferLimit),
        single: toTaka(account.singleTransactionLimit),
        min: toTaka(account.minimumBalance),
      });
    }
  }, [account]);

  if (isLoading) return <Skeleton className="h-96" />;
  if (!account) return <p className="text-sm text-slate-500">Account not found.</p>;

  const owner = typeof account.owner === "object" ? account.owner : null;

  const saveLimits = async () => {
    const values = [limits.daily, limits.single, limits.min];
    if (values.some((v) => v.trim() !== "" && (Number.isNaN(Number(v)) || Number(v) < 0))) {
      toast.error("Limits must be positive numbers");
      return;
    }
    try {
      await setLimits({
        id: account._id,
        dailyTransferLimit: toBody(limits.daily),
        singleTransactionLimit: toBody(limits.single),
        minimumBalance: toBody(limits.min),
      }).unwrap();
      toast.success("Limits saved");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const changeStatus = async () => {
    if (!pending) return;
    try {
      await setStatus({ id: account._id, status: pending }).unwrap();
      toast.success(`Account ${pending.toLowerCase()}`);
      setPending(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <>
      <Link href="/admin/accounts" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Accounts
      </Link>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <AccountCard account={account} />
          {owner && (
            <Card>
              <p className="text-xs uppercase tracking-wider text-slate-500">Owner</p>
              <Link href={`/admin/customers/${owner._id}`} className="mt-1 block font-medium hover:text-brand-600 hover:underline">
                {owner.name}
              </Link>
              <p className="text-sm text-slate-500">{owner.email}</p>
            </Card>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardTitle>Account status</CardTitle>
            <p className="mb-4 text-sm text-slate-500">A frozen account cannot send or receive money. Closing is permanent for this demo.</p>
            <div className="flex flex-wrap gap-2">
              {account.status === "ACTIVE" && (
                <Button variant="danger" onClick={() => setPending("FROZEN")}>
                  <Snowflake className="h-4 w-4" /> Freeze
                </Button>
              )}
              {account.status === "FROZEN" && (
                <Button onClick={() => setPending("ACTIVE")}>
                  <Sun className="h-4 w-4" /> Unfreeze
                </Button>
              )}
              {account.status !== "CLOSED" && (
                <Button variant="secondary" onClick={() => setPending("CLOSED")}>
                  <XCircle className="h-4 w-4" /> Close
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>Transaction limits</CardTitle>
            <div className="space-y-3">
              <Input label="Daily transfer limit" prefix="BDT" inputMode="decimal" value={limits.daily} onChange={(e) => setLimitsForm({ ...limits, daily: e.target.value })} placeholder="Bank default" />
              <Input label="Max single transaction" prefix="BDT" inputMode="decimal" value={limits.single} onChange={(e) => setLimitsForm({ ...limits, single: e.target.value })} placeholder="Bank default" />
              <Input label="Minimum balance" prefix="BDT" inputMode="decimal" value={limits.min} onChange={(e) => setLimitsForm({ ...limits, min: e.target.value })} placeholder="Bank default" />
              <p className="text-xs text-slate-500">Leave a field empty to use the bank wide setting.</p>
              <Button onClick={saveLimits} loading={savingLimits}>
                Save limits
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <TransactionsView accountId={account._id} allowFlag />

      <ConfirmDialog
        open={!!pending}
        title={pending === "FROZEN" ? "Freeze this account?" : pending === "ACTIVE" ? "Unfreeze this account?" : "Close this account?"}
        tone={pending === "ACTIVE" ? "primary" : "danger"}
        loading={savingStatus}
        onCancel={() => setPending(null)}
        onConfirm={changeStatus}
      >
        {pending === "FROZEN"
          ? "All transfers, deposits and withdrawals on this account will be blocked."
          : pending === "ACTIVE"
            ? "The account will be able to send and receive money again."
            : "The account will no longer be usable."}
      </ConfirmDialog>
    </>
  );
}