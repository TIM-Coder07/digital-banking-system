"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { setPinSchema } from "@/lib/validations/auth.schema";
import { useSetPinMutation } from "@/store/features/auth/authApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const formSchema = setPinSchema
  .extend({ confirmPin: z.string() })
  .refine((d) => d.pin === d.confirmPin, { path: ["confirmPin"], message: "PINs do not match" });
type FormValues = z.infer<typeof formSchema>;

export default function CustomerSettingsPage() {
  const [setPin, { isLoading }] = useSetPinMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const onSubmit = async ({ pin, currentPassword }: FormValues) => {
    try {
      await setPin({ pin, currentPassword }).unwrap();
      toast.success("Transaction PIN updated");
      reset({ pin: "", confirmPin: "", currentPassword: "" });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update PIN"));
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Security and preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <CardTitle>Transaction PIN</CardTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input label="New PIN (4 to 6 digits)" type="password" inputMode="numeric" maxLength={6} autoComplete="off" {...register("pin")} error={errors.pin?.message} />
            <Input label="Confirm PIN" type="password" inputMode="numeric" maxLength={6} autoComplete="off" {...register("confirmPin")} error={errors.confirmPin?.message} />
            <Input label="Current password" type="password" autoComplete="current-password" {...register("currentPassword")} error={errors.currentPassword?.message} />
            <Button type="submit" loading={isLoading}>
              Save PIN
            </Button>
          </form>
        </Card>
        <Card className="h-fit">
          <CardTitle action={<ThemeToggle />}>Appearance</CardTitle>
          <p className="text-sm text-slate-500">Switch between light and dark mode.</p>
        </Card>
      </div>
    </>
  );
}