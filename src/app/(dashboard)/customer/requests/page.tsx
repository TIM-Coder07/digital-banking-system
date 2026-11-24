"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { fundRequestSchema, type FundRequestValues } from "@/lib/validations/request.schema";
import { useCreateRequestMutation, useGetRequestsQuery } from "@/store/features/requests/requestApi";
import { useGetAccountsQuery } from "@/store/features/accounts/accountApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { label } from "@/lib/constants";
import { formatDate, formatMoney, maskAccount } from "@/lib/format";

export default function CustomerRequestsPage() {
  const [page, setPage] = useState(1);
  const { data: accounts } = useGetAccountsQuery();
  const { data, isLoading } = useGetRequestsQuery({ page });
  const [createRequest, { isLoading: saving }] = useCreateRequestMutation();
  const active = accounts?.items.filter((a) => a.status === "ACTIVE") ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FundRequestValues>({
    resolver: zodResolver(fundRequestSchema),
    defaultValues: { type: "DEPOSIT", accountId: "" },
  });
  const type = watch("type");

  const onSubmit = async (values: FundRequestValues) => {
    try {
      await createRequest(values).unwrap();
      toast.success("Request submitted. Bank staff will review it.");
      reset({ type: values.type, accountId: values.accountId, description: "" });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not submit request"));
    }
  };

  return (
    <>
      <PageHeader title="Deposit & withdraw" description="Submit a request. Money moves only after bank staff approve it." />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit p-6">
          <CardTitle>New request</CardTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-2">
              {(["DEPOSIT", "WITHDRAWAL"] as const).map((t) => (
                <label
                  key={t}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium transition ${
                    type === t
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
                  }`}
                >
                  <input type="radio" value={t} {...register("type")} className="sr-only" />
                  {label(t)}
                </label>
              ))}
            </div>

            <Select label="Account" {...register("accountId")} error={errors.accountId?.message}>
              <option value="" disabled>
                Select an account
              </option>
              {active.map((a) => (
                <option key={a._id} value={a._id}>
                  {label(a.type)} {maskAccount(a.accountNumber)} · {formatMoney(a.balance)}
                </option>
              ))}
            </Select>

            <Input label="Amount" prefix="BDT" inputMode="decimal" placeholder="0.00" {...register("amount")} error={errors.amount?.message} />
            <Input label="Description (optional)" placeholder="Cash deposit at branch" {...register("description")} error={errors.description?.message} />

            <Button type="submit" className="w-full" loading={saving}>
              Submit request
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>My requests</CardTitle>
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : !data?.items.length ? (
            <EmptyState title="No requests yet" description="Your deposit and withdrawal requests will show here." />
          ) : (
            <>
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/5">
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium">Account</th>
                      <th className="px-5 py-3 text-right font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {data.items.map((r) => (
                      <tr key={r._id}>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                        <td className="px-5 py-3">{label(r.type)}</td>
                        <td className="px-5 py-3 text-slate-500">{r.account ? maskAccount(r.account.accountNumber) : "-"}</td>
                        <td className="num px-5 py-3 text-right font-semibold">{formatMoney(r.amount)}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={r.status} />
                          {r.reviewNote && <p className="mt-1 text-xs text-slate-500">{r.reviewNote}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
            </>
          )}
        </Card>
      </div>
    </>
  );
}