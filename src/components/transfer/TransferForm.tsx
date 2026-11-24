"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { transferSchema, type TransferValues } from "@/lib/validations/transfer.schema";
import { useGetAccountsQuery } from "@/store/features/accounts/accountApi";
import { useTransferMutation } from "@/store/features/transactions/transactionApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { label } from "@/lib/constants";
import { formatMoney, groupAccount, maskAccount } from "@/lib/format";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function TransferForm() {
  const router = useRouter();
  const { data: accounts } = useGetAccountsQuery();
  const [transfer, { isLoading }] = useTransferMutation();
  const [pending, setPending] = useState<TransferValues | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // One key per confirmed transfer: a retry or double click cannot send money twice.
  const keyRef = useRef<string | null>(null);

  const active = accounts?.items.filter((a) => a.status === "ACTIVE") ?? [];
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferValues>({ resolver: zodResolver(transferSchema) });

  const fromId = watch("fromAccountId");
  const from = active.find((a) => a._id === fromId);

  const onReview = (values: TransferValues) => {
    setServerError(null);
    keyRef.current = crypto.randomUUID();
    setPending(values);
  };

  const onConfirm = async () => {
    if (!pending || !keyRef.current) return;
    try {
      const txn = await transfer({ ...pending, idempotencyKey: keyRef.current }).unwrap();
      toast.success(`Transfer completed. Ref ${txn.txnId}`);
      router.push(`/customer/transactions/${txn._id}`);
    } catch (err) {
      setServerError(apiErrorMessage(err, "Transfer failed"));
      setPending(null);
      setValue("pin", "");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onReview)} className="space-y-5" noValidate>
        <Select label="From account" {...register("fromAccountId")} error={errors.fromAccountId?.message} defaultValue="">
          <option value="" disabled>
            Select an account
          </option>
          {active.map((a) => (
            <option key={a._id} value={a._id}>
              {label(a.type)} {maskAccount(a.accountNumber)} · {formatMoney(a.balance)}
            </option>
          ))}
        </Select>

        <Input
          label="Recipient account number"
          inputMode="numeric"
          maxLength={12}
          placeholder="12 digit account number"
          {...register("toAccountNumber")}
          error={errors.toAccountNumber?.message}
          hint={
            active.length > 1 ? (
              <span>
                Own accounts:{" "}
                {active
                  .filter((a) => a._id !== fromId)
                  .map((a) => (
                    <button key={a._id} type="button" className="mr-2 font-mono text-brand-600 hover:underline" onClick={() => setValue("toAccountNumber", a.accountNumber, { shouldValidate: true })}>
                      {groupAccount(a.accountNumber)}
                    </button>
                  ))}
              </span>
            ) : undefined
          }
        />

        <Input
          label="Amount"
          prefix="BDT"
          inputMode="decimal"
          placeholder="0.00"
          {...register("amount")}
          error={errors.amount?.message}
          hint={from ? `Available ${formatMoney(from.balance)}` : undefined}
        />

        <Input label="Description (optional)" placeholder="Rent, invoice #, etc." {...register("description")} error={errors.description?.message} />

        <Input label="Transaction PIN" type="password" inputMode="numeric" autoComplete="off" maxLength={6} {...register("pin")} error={errors.pin?.message} />

        {serverError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{serverError}</p>}

        <Button type="submit" className="w-full sm:w-auto">
          Review transfer
        </Button>
      </form>

      <ConfirmDialog open={!!pending} title="Confirm transfer" confirmLabel="Send money" loading={isLoading} onConfirm={onConfirm} onCancel={() => setPending(null)}>
        {pending && (
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt>From</dt>
              <dd className="font-mono">{from ? groupAccount(from.accountNumber) : ""}</dd>
            </div>
            <div className="flex justify-between">
              <dt>To</dt>
              <dd className="font-mono">{groupAccount(pending.toAccountNumber)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold text-slate-900 dark:text-white">
              <dt>Amount</dt>
              <dd className="num">{formatMoney(Math.round(pending.amount * 100))}</dd>
            </div>
            <p className="pt-2 text-xs text-slate-500">A small fee may apply for transfers to other customers. The final amount is calculated by the bank.</p>
          </dl>
        )}
      </ConfirmDialog>
    </>
  );
}
