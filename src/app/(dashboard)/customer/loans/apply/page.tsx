"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { applyLoanSchema, type ApplyLoanValues } from "@/lib/validations/loan.schema";
import { useApplyLoanMutation } from "@/store/features/loans/loanApi";
import { useGetAccountsQuery } from "@/store/features/accounts/accountApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, fieldClass } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EMPLOYMENT_STATUS, LOAN_TYPES, label } from "@/lib/constants";
import { formatMoney, maskAccount } from "@/lib/format";
import { DEFAULT_LOAN_RATE, calcEmi } from "@/lib/loan";
import { cn } from "@/lib/utils";

export default function ApplyLoanPage() {
  const router = useRouter();
  const { data: accounts } = useGetAccountsQuery();
  const [applyLoan, { isLoading }] = useApplyLoanMutation();
  const active = accounts?.items.filter((a) => a.status === "ACTIVE") ?? [];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ApplyLoanValues>({
    resolver: zodResolver(applyLoanSchema),
    defaultValues: { loanType: "PERSONAL", employmentStatus: "EMPLOYED", accountId: "", durationMonths: 12 },
  });

  const amount = Number(watch("amount")) || 0;
  const months = Number(watch("durationMonths")) || 0;
  const preview = calcEmi(Math.round(amount * 100), DEFAULT_LOAN_RATE, months);

  const onSubmit = async (values: ApplyLoanValues) => {
    try {
      const loan = await applyLoan(values).unwrap();
      toast.success("Application submitted. We will review it shortly.");
      router.push(`/customer/loans/${loan._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not submit application"));
    }
  };

  return (
    <>
      <PageHeader title="Apply for a loan" description="Tell us what you need. Staff review it, then admin makes the final decision." />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Select label="Loan type" {...register("loanType")} error={errors.loanType?.message}>
              {LOAN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {label(t)}
                </option>
              ))}
            </Select>
            <Select label="Disbursement account" {...register("accountId")} error={errors.accountId?.message}>
              <option value="" disabled>
                Select an account
              </option>
              {active.map((a) => (
                <option key={a._id} value={a._id}>
                  {label(a.type)} {maskAccount(a.accountNumber)}
                </option>
              ))}
            </Select>
            <Input label="Requested amount" prefix="BDT" inputMode="decimal" {...register("amount")} error={errors.amount?.message} />
            <Input label="Duration (months)" type="number" min={3} max={360} {...register("durationMonths")} error={errors.durationMonths?.message} />
            <Input label="Monthly income" prefix="BDT" inputMode="decimal" {...register("monthlyIncome")} error={errors.monthlyIncome?.message} />
            <Select label="Employment status" {...register("employmentStatus")} error={errors.employmentStatus?.message}>
              {EMPLOYMENT_STATUS.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </Select>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="description" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Purpose of the loan
              </label>
              <textarea id="description" rows={4} {...register("description")} className={cn(fieldClass, errors.description && "border-rose-400")} />
              {errors.description && <p className="text-xs text-rose-600">{errors.description.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={isLoading}>
                Submit application
              </Button>
            </div>
          </form>
        </Card>

        <Card className="h-fit">
          <CardTitle>Estimated repayment</CardTitle>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Monthly installment</dt>
              <dd className="num text-lg font-semibold">{formatMoney(preview.emi)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Total interest</dt>
              <dd className="num">{formatMoney(preview.interest)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Total payable</dt>
              <dd className="num font-medium">{formatMoney(preview.total)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">Estimate at {DEFAULT_LOAN_RATE}% per year. The bank confirms the final rate on approval.</p>
        </Card>
      </div>
    </>
  );
}