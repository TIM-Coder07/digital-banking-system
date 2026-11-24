"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { useGetCustomerQuery, useSetCustomerStatusMutation, useVerifyCustomerMutation } from "@/store/features/customers/customerApi";
import { useCreateAccountMutation } from "@/store/features/accounts/accountApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { fieldClass } from "@/components/ui/Input";
import { TransactionsView } from "@/components/transactions/TransactionsView";
import { ACCOUNT_TYPES, label, type AccountType, type UserStatus } from "@/lib/constants";
import { formatDay, formatMoney, groupAccount } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = { id: string; backHref: string; accountHrefBase?: string; canManageStatus?: boolean };

const STATUS_ACTIONS: { status: UserStatus; label: string; tone: "primary" | "danger" }[] = [
  { status: "ACTIVE", label: "Activate", tone: "primary" },
  { status: "INACTIVE", label: "Deactivate", tone: "danger" },
  { status: "BLOCKED", label: "Block", tone: "danger" },
];

export function CustomerDetail({ id, backHref, accountHrefBase, canManageStatus }: Props) {
  const { data: c, isLoading } = useGetCustomerQuery(id);
  const [verify, { isLoading: verifying }] = useVerifyCustomerMutation();
  const [createAccount, { isLoading: creating }] = useCreateAccountMutation();
  const [setStatus, { isLoading: savingStatus }] = useSetCustomerStatusMutation();
  const [type, setType] = useState<AccountType>("SAVINGS");
  const [pendingStatus, setPendingStatus] = useState<UserStatus | null>(null);
  const [historyAcc, setHistoryAcc] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-96" />;
  if (!c) return <p className="text-sm text-slate-500">Customer not found.</p>;

  const selectedAcc = historyAcc ?? c.accounts[0]?._id ?? null;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const profile: [string, string][] = [
    ["Email", c.email],
    ["Phone", c.phone ?? "-"],
    ["Address", c.address ?? "-"],
    ["National ID", c.nationalId ?? "-"],
    ["Joined", formatDay(c.createdAt)],
    ["Transactions", String(c.transactionCount)],
  ];

  return (
    <>
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Customers
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{c.name}</h1>
        <StatusBadge status={c.status} />
        <StatusBadge status={c.isVerified ? "APPROVED" : "PENDING"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Card>
            <CardTitle
              action={
                !c.isVerified && (
                  <Button className="px-3 py-1.5 text-xs" loading={verifying} onClick={() => run(() => verify(c._id).unwrap(), "Customer verified")}>
                    <BadgeCheck className="h-4 w-4" /> Verify KYC
                  </Button>
                )
              }
            >
              Profile
            </CardTitle>
            <dl className="divide-y divide-slate-100 text-sm dark:divide-white/5">
              {profile.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {canManageStatus && (
            <Card>
              <CardTitle>Customer status</CardTitle>
              <p className="mb-3 text-sm text-slate-500">Blocking also freezes every active account of this customer.</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_ACTIONS.filter((a) => a.status !== c.status).map((a) => (
                  <Button key={a.status} variant={a.tone === "danger" ? "secondary" : "primary"} onClick={() => setPendingStatus(a.status)}>
                    {a.label}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card>
          <CardTitle>Bank accounts</CardTitle>
          {c.accounts.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {c.accounts.map((a) => (
                <li key={a._id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    {accountHrefBase ? (
                      <Link href={`${accountHrefBase}/${a._id}`} className="font-mono text-sm font-medium hover:text-brand-600 hover:underline">
                        {groupAccount(a.accountNumber)}
                      </Link>
                    ) : (
                      <p className="font-mono text-sm font-medium">{groupAccount(a.accountNumber)}</p>
                    )}
                    <p className="text-xs text-slate-500">{label(a.type)}</p>
                  </div>
                  <div className="text-right">
                    <p className="num font-semibold">{formatMoney(a.balance)}</p>
                    <StatusBadge status={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No accounts yet.</p>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/5">
            <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">Open a new account</p>
            <div className="flex gap-2">
              <select value={type} onChange={(e) => setType(e.target.value as AccountType)} className={cn(fieldClass, "flex-1")} disabled={!c.isVerified}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {label(t)}
                  </option>
                ))}
              </select>
              <Button
                disabled={!c.isVerified || c.status !== "ACTIVE"}
                loading={creating}
                onClick={() => run(() => createAccount({ ownerId: c._id, type }).unwrap(), `${label(type)} account opened`)}
              >
                <Plus className="h-4 w-4" /> Open
              </Button>
            </div>
            {!c.isVerified && <p className="mt-2 text-xs text-amber-600">Verify the customer before opening an account.</p>}
          </div>
        </Card>
      </div>

      {c.accounts.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-2 text-base font-semibold">Transaction history</h2>
            {c.accounts.map((a) => (
              <button
                key={a._id}
                onClick={() => setHistoryAcc(a._id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  selectedAcc === a._id ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900" : "bg-white ring-1 ring-slate-200 dark:bg-ink-800 dark:ring-white/10"
                )}
              >
                {label(a.type)} ••{a.accountNumber.slice(-4)}
              </button>
            ))}
          </div>
          {selectedAcc && <TransactionsView key={selectedAcc} accountId={selectedAcc} />}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingStatus}
        title={`Change status to ${pendingStatus ? label(pendingStatus) : ""}?`}
        tone={pendingStatus === "ACTIVE" ? "primary" : "danger"}
        loading={savingStatus}
        onCancel={() => setPendingStatus(null)}
        onConfirm={async () => {
          if (!pendingStatus) return;
          await run(() => setStatus({ id: c._id, status: pendingStatus }).unwrap(), "Status updated");
          setPendingStatus(null);
        }}
      >
        {pendingStatus === "BLOCKED"
          ? "The customer will be signed out of every action and all active accounts will be frozen."
          : pendingStatus === "INACTIVE"
            ? "The customer will not be able to sign in or make transactions."
            : "The customer will be able to sign in again. Frozen accounts stay frozen until you unfreeze them."}
      </ConfirmDialog>
    </>
  );
}