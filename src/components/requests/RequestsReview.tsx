"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useGetRequestsQuery, useReviewRequestMutation } from "@/store/features/requests/requestApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { fieldClass } from "@/components/ui/Input";
import { REQUEST_STATUS, label, type RequestStatus } from "@/lib/constants";
import { formatDate, formatMoney, groupAccount } from "@/lib/format";
import type { FundRequest } from "@/types";
import { cn } from "@/lib/utils";

type Pending = { req: FundRequest; decision: "APPROVE" | "REJECT" } | null;

/** Approve / reject deposit and withdrawal requests. Shared by staff and admin. */
export function RequestsReview() {
  const [status, setStatus] = useState<RequestStatus>("PENDING");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<Pending>(null);
  const [note, setNote] = useState("");
  const { data, isLoading, isFetching } = useGetRequestsQuery({ status, page });
  const [review, { isLoading: saving }] = useReviewRequestMutation();

  const onConfirm = async () => {
    if (!pending) return;
    try {
      await review({ id: pending.req._id, decision: pending.decision, note: note || undefined }).unwrap();
      toast.success(pending.decision === "APPROVE" ? "Approved. Balance updated." : "Request rejected");
      setPending(null);
      setNote("");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Review failed"));
    }
  };

  const customerName = (r: FundRequest) => (typeof r.customer === "object" ? r.customer.name : "");

  return (
    <Card className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/5 sm:w-fit">
        {REQUEST_STATUS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              "flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition sm:flex-none",
              status === s ? "bg-white text-slate-900 shadow-sm dark:bg-ink-700 dark:text-white" : "text-slate-500"
            )}
          >
            {label(s)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !data?.items.length ? (
        <EmptyState title={`No ${label(status).toLowerCase()} requests`} />
      ) : (
        <div className={isFetching ? "opacity-60" : ""}>
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/5">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Account</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Requested</th>
                  <th className="px-5 py-3 font-medium">{status === "PENDING" ? "Action" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {data.items.map((r) => (
                  <tr key={r._id}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{customerName(r)}</p>
                      {r.description && <p className="text-xs text-slate-500">{r.description}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("font-medium", r.type === "DEPOSIT" ? "text-emerald-600" : "text-rose-600")}>{label(r.type)}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{r.account ? groupAccount(r.account.accountNumber) : "-"}</td>
                    <td className="num px-5 py-3 text-right font-semibold">{formatMoney(r.amount)}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                    <td className="px-5 py-3">
                      {r.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <Button className="px-3 py-1.5 text-xs" onClick={() => setPending({ req: r, decision: "APPROVE" })}>
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setPending({ req: r, decision: "REJECT" })}>
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <>
                          <StatusBadge status={r.status} />
                          {r.reviewNote && <p className="mt-1 text-xs text-slate-500">{r.reviewNote}</p>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        title={pending?.decision === "APPROVE" ? `Approve ${label(pending.req.type).toLowerCase()}?` : "Reject request?"}
        confirmLabel={pending?.decision === "APPROVE" ? "Approve" : "Reject"}
        tone={pending?.decision === "APPROVE" ? "primary" : "danger"}
        loading={saving}
        onCancel={() => {
          setPending(null);
          setNote("");
        }}
        onConfirm={onConfirm}
      >
        {pending && (
          <div className="space-y-3">
            <p>
              {customerName(pending.req)} · <b>{formatMoney(pending.req.amount)}</b>
              {pending.decision === "APPROVE" && (pending.req.type === "DEPOSIT" ? " will be added to the account." : " will be deducted from the account.")}
            </p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Note for the customer (optional)" className={fieldClass} />
          </div>
        )}
      </ConfirmDialog>
    </Card>
  );
}