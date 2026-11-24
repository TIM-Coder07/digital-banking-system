"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useGetLoanQuery, useRepayLoanMutation } from "@/store/features/loans/loanApi";
import { useGetAccountsQuery } from "@/store/features/accounts/accountApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { Card, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatCard } from "@/components/dashboard/StatCard";
import { RepaymentSchedule } from "@/components/loans/RepaymentSchedule";
import { label } from "@/lib/constants";
import { formatDate, formatDay, formatMoney, maskAccount } from "@/lib/format";
import { CalendarClock, HandCoins, PiggyBank, Wallet } from "lucide-react";

export default function CustomerLoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetLoanQuery(id);
  const { data: accounts } = useGetAccountsQuery();
  const [repay, { isLoading: paying }] = useRepayLoanMutation();
  const [accountId, setAccountId] = useState("");
  const [pin, setPin] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return <p className="text-sm text-slate-500">Loan not found.</p>;

  const { loan, repayments } = data;
  const next = loan.schedule.find((s) => !s.paid);
  const active = accounts?.items.filter((a) => a.status === "ACTIVE") ?? [];
  const nextAmount = next ? Math.min(next.amount, loan.remainingBalance ?? next.amount) : 0;

  const onPay = async () => {
    try {
      const res = await repay({ id: loan._id, accountId, pin }).unwrap();
      toast.success(`Installment paid. Ref ${res.txnId}`);
      setPin("");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Payment failed"));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <Link href="/customer/loans" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> My loans
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{label(loan.loanType)} loan</h1>
        <StatusBadge status={loan.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Loan amount" value={formatMoney(loan.amount)} icon={HandCoins} tone="brand" />
        <StatCard label="Remaining" value={formatMoney(loan.remainingBalance ?? loan.amount)} icon={Wallet} tone="rose" />
        <StatCard label="Monthly EMI" value={loan.emiAmount ? formatMoney(loan.emiAmount) : "-"} icon={PiggyBank} tone="sky" hint={`${loan.interestRate}% p.a. · ${loan.durationMonths} months`} />
        <StatCard label="Next due" value={next ? formatDay(next.dueDate) : "-"} icon={CalendarClock} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardTitle>Repayment schedule</CardTitle>
          {loan.schedule.length ? (
            <RepaymentSchedule schedule={loan.schedule} />
          ) : (
            <p className="text-sm text-slate-500">The schedule is created when the loan is approved and disbursed.</p>
          )}
        </Card>

        <div className="space-y-6">
          {loan.status === "ACTIVE" && next && (
            <Card>
              <CardTitle>Pay next installment</CardTitle>
              <p className="num mb-4 text-2xl font-semibold">{formatMoney(nextAmount)}</p>
              <div className="space-y-3">
                <Select label="Pay from" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  <option value="" disabled>
                    Select an account
                  </option>
                  {active.map((a) => (
                    <option key={a._id} value={a._id}>
                      {label(a.type)} {maskAccount(a.accountNumber)} · {formatMoney(a.balance)}
                    </option>
                  ))}
                </Select>
                <Input label="Transaction PIN" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} />
                <Button className="w-full" disabled={!accountId || pin.length < 4} onClick={() => setConfirming(true)}>
                  Pay installment {next.installmentNo}
                </Button>
              </div>
            </Card>
          )}

          <Card>
            <CardTitle>Status history</CardTitle>
            <ol className="space-y-4 border-l border-slate-200 pl-4 dark:border-white/10">
              {loan.statusHistory.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  <StatusBadge status={h.status} />
                  <p className="mt-1 text-xs text-slate-500">{formatDate(h.at)}</p>
                  {h.note && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardTitle>Repayment history</CardTitle>
            {repayments.length ? (
              <ul className="divide-y divide-slate-100 text-sm dark:divide-white/5">
                {repayments.map((r) => (
                  <li key={r._id} className="flex justify-between py-2">
                    <span className="text-slate-500">
                      #{r.installmentNo} · {formatDay(r.paidAt)}
                    </span>
                    <span className="num font-medium">{formatMoney(r.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No repayments yet.</p>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog open={confirming} title="Confirm payment" confirmLabel="Pay now" loading={paying} onConfirm={onPay} onCancel={() => setConfirming(false)}>
        Pay <b>{formatMoney(nextAmount)}</b> for installment {next?.installmentNo} of your {label(loan.loanType).toLowerCase()} loan?
      </ConfirmDialog>
    </>
  );
}