"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { bankSettingsSchema } from "@/lib/validations/account.schema";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/features/settings/settingsApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

type Values = z.infer<typeof bankSettingsSchema>;

export default function BankSettingsPage() {
  const { data, isLoading } = useGetSettingsQuery();
  const [update, { isLoading: saving }] = useUpdateSettingsMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Values>({ resolver: zodResolver(bankSettingsSchema) });

  // API values are paisa, the form works in taka.
  useEffect(() => {
    if (!data) return;
    reset({
      dailyTransferLimit: data.dailyTransferLimit / 100,
      maxSingleTransaction: data.maxSingleTransaction / 100,
      minimumBalance: data.minimumBalance / 100,
      transferFeeBps: data.transferFeeBps,
      loanInterestRate: data.loanInterestRate,
      largeTransactionThreshold: data.largeTransactionThreshold / 100,
      velocityLimit: data.velocityLimit,
    });
  }, [data, reset]);

  const onSubmit = async (values: Values) => {
    try {
      await update(values).unwrap();
      toast.success("Bank settings saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save settings"));
    }
  };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <>
      <PageHeader title="Bank settings" description="Limits and rules for every account. A per account limit overrides these." />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <CardTitle>Transaction limits</CardTitle>
            <div className="space-y-4">
              <Input label="Daily transfer limit" prefix="BDT" inputMode="decimal" {...register("dailyTransferLimit")} error={errors.dailyTransferLimit?.message} />
              <Input label="Maximum single transaction" prefix="BDT" inputMode="decimal" {...register("maxSingleTransaction")} error={errors.maxSingleTransaction?.message} />
              <Input label="Minimum account balance" prefix="BDT" inputMode="decimal" {...register("minimumBalance")} error={errors.minimumBalance?.message} />
              <Input label="Transfer fee (basis points)" type="number" {...register("transferFeeBps")} error={errors.transferFeeBps?.message} hint="10 bps = 0.10%. Charged only on transfers to other customers." />
            </div>
          </Card>
          <Card className="p-6">
            <CardTitle>Loans & fraud rules</CardTitle>
            <div className="space-y-4">
              <Input label="Loan interest rate (% per year)" type="number" step="0.1" {...register("loanInterestRate")} error={errors.loanInterestRate?.message} />
              <Input label="Flag transfers at or above" prefix="BDT" inputMode="decimal" {...register("largeTransactionThreshold")} error={errors.largeTransactionThreshold?.message} />
              <Input label="Flag after this many transfers in 10 minutes" type="number" {...register("velocityLimit")} error={errors.velocityLimit?.message} />
            </div>
          </Card>
        </div>
        <Button type="submit" loading={saving} disabled={!isDirty}>
          Save settings
          
        </Button>
      </form>
    </>
  );
}