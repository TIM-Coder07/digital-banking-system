"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Forward, X } from "lucide-react";
import { toast } from "sonner";
import { useAddLoanNoteMutation, useDecideLoanMutation, useForwardLoanMutation, useGetLoanQuery } from "@/store/features/loans/loanApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { fieldClass } from "@/components/ui/Input";
import { RepaymentSchedule } from "./RepaymentSchedule";
import { label } from "@/lib/constants";
import { formatDate, formatMoney, groupAccount } from "@/lib/format";
import { calcEmi } from "@/lib/loan";
import type { UserSummary } from "@/types";

type Props = { id: string; mode: "STAFF" | "ADMIN"; backHref: string };

/** Staff: notes + forward. Admin: notes + approve / reject. */
export function LoanReview({ id, mode, backHref }: Props) {
  const { data, isLoading } = useGetLoanQuery(id);
  const [addNote, { isLoading: noting }] = useAddLoanNoteMutation();
  const [forward, { isLoading: forwarding }] = useForwardLoanMutation();
  const [decide, { isLoading: deciding }] = useDecideLoanMutation();
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState<"APPROVE" | "REJECT" | null>(null);

  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return <p className="text-sm text-slate-500">Loan not found.</p>;

  const { loan, notes, repayments } = data;
  const customer = typeof loan.customer === "object" ? (loan.customer as Partial<UserSummary>) : null;
  const est = calcEmi(loan.amount, loan.interestRate, loan.durationMonths);
  const emi = loan.emiAmount ?? est.emi;
  const dti = loan.monthlyIncome ? Math.round((emi / loan.monthlyIncome) * 100) : 0;
  const canForward = mode === "STAFF" && loan.status === "PENDING";
  const canDecide = mode === "ADMIN" && (loan.status === "PENDING" || loan.status === "UNDER_REVIEW");

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      return true;
    } catch (err) {
      toast.error(apiErrorMessage(err));
      return false;
    }
  };

  const details: [string, string][] = [
    ["Loan type", label(loan.loanType)],
    ["Amount", formatMoney(loan.amount)],
    ["Duration", `${loan.durationMonths} months`],
    ["Interest", `${loan.interestRate}% p.a.`],
    ["Monthly EMI", formatMoney(emi)],
    ["Total payable", formatMoney(loan.totalPayable ?? est.total)],
    ["Disbursement account", loan.account ? groupAccount(loan.account.accountNumber) : "-"],
    ["Applied", formatDate(loan.createdAt)],
  ];

  return (
    <>
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Loan applications
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {label(loan.loanType)} loan · {customer?.name}
        </h1>
        <StatusBadge status={loan.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardTitle>Application</CardTitle>
            <dl className="grid gap-x-8 text-sm sm:grid-cols-2">
              {details.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-slate-100 py-2 dark:border-white/5">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {loan.description && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Purpose</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{loan.description}</p>
              </div>
            )}
          </Card>

          <Card>
            <CardTitle>Applicant</CardTitle>
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-slate-500">Name</p>
                <p className="font-medium">{customer?.name}</p>
                <p className="text-xs text-slate-500">{customer?.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Employment</p>
                <p className="font-medium">{label(loan.employmentStatus)}</p>
                <p className="text-xs text-slate-500">Income {formatMoney(loan.monthlyIncome)}/mo</p>
              </div>
              <div>
                <p className="text-slate-500">EMI to income</p>
                <p className={`num text-lg font-semibold ${dti > 50 ? "text-rose-600" : dti > 35 ? "text-amber-600" : "text-emerald-600"}`}>{dti}%</p>
                <p className="text-xs text-slate-500">{dti > 50 ? "High risk" : dti > 35 ? "Moderate" : "Healthy"}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">KYC: {customer?.isVerified ? "Verified" : "Not verified"}</p>
          </Card>

          {loan.schedule.length > 0 && (
            <Card>
              <CardTitle>Repayment schedule · {formatMoney(loan.remainingBalance ?? 0)} remaining</CardTitle>
              <RepaymentSchedule schedule={loan.schedule} />
              <p className="mt-3 text-xs text-slate-500">{repayments.length} installment(s) paid</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {canForward && (
            <Card>
              <CardTitle>Forward for approval</CardTitle>
              <p className="mb-3 text-sm text-slate-500">Send this application to admin after reviewing the customer&apos;s information.</p>
              <Button
                loading={forwarding}
                onClick={() => run(() => forward({ id: loan._id, note: note.trim() || undefined }).unwrap(), "Forwarded to admin").then((ok) => ok && setNote(""))}
              >
                <Forward className="h-4 w-4" /> Forward to admin
              </Button>
              <p className="mt-2 text-xs text-slate-500">Text in the note box below is attached when you forward.</p>
            </Card>
          )}

          {canDecide && (
            <Card>
              <CardTitle>Decision</CardTitle>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason (shown to the customer)" className={fieldClass} />
              <div className="mt-3 flex gap-2">
                <Button onClick={() => setDecision("APPROVE")}>
                  <Check className="h-4 w-4" /> Approve & disburse
                </Button>
                <Button variant="secondary" onClick={() => setDecision("REJECT")}>
                  <X className="h-4 w-4" /> Reject
                </Button>
              </div>
            </Card>
          )}

          <Card>
            <CardTitle>Internal notes</CardTitle>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Visible to staff and admin only" className={fieldClass} />
            <Button
              variant="secondary"
              className="mt-2"
              disabled={!note.trim()}
              loading={noting}
              onClick={() => run(() => addNote({ id: loan._id, note: note.trim() }).unwrap(), "Note added").then((ok) => ok && setNote(""))}
            >
              Add note
            </Button>
            <ul className="mt-4 space-y-3">
              {notes.map((n) => (
                <li key={n._id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-white/[0.03]">
                  <p>{n.note}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {n.author?.name} · {label(n.author?.role ?? "")} · {formatDate(n.createdAt)}
                  </p>
                </li>
              ))}
              {!notes.length && <li className="text-sm text-slate-500">No notes yet.</li>}
            </ul>
          </Card>

          <Card>
            <CardTitle>Status history</CardTitle>
            <ol className="space-y-3 border-l border-slate-200 pl-4 dark:border-white/10">
              {loan.statusHistory.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  <StatusBadge status={h.status} />
                  <p className="mt-1 text-xs text-slate-500">{formatDate(h.at)}</p>
                  {h.note && <p className="text-sm text-slate-600 dark:text-slate-300">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!decision}
        title={decision === "APPROVE" ? "Approve and disburse?" : "Reject application?"}
        confirmLabel={decision === "APPROVE" ? "Approve" : "Reject"}
        tone={decision === "APPROVE" ? "primary" : "danger"}
        loading={deciding}
        onCancel={() => setDecision(null)}
        onConfirm={async () => {
          if (!decision) return;
          const ok = await run(
            () => decide({ id: loan._id, decision, reason: reason.trim() || undefined }).unwrap(),
            decision === "APPROVE" ? "Loan approved and disbursed" : "Loan rejected"
          );
          if (ok) setReason("");
          setDecision(null);
        }}
      >
        {decision === "APPROVE"
          ? `${formatMoney(loan.amount)} will be credited to the customer's account and a repayment schedule of ${loan.durationMonths} installments will be created.`
          : "The customer will be notified that the application was rejected."}
      </ConfirmDialog>
    </>
  );
}