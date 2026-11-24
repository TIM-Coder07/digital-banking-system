"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { registerCustomerSchema, type RegisterCustomerInput } from "@/lib/validations/auth.schema";
import { useCreateCustomerMutation } from "@/store/features/customers/customerApi";
import { apiErrorMessage } from "@/store/api/baseApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterCustomerPage() {
  const router = useRouter();
  const [createCustomer, { isLoading }] = useCreateCustomerMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterCustomerInput>({ resolver: zodResolver(registerCustomerSchema) });

  const onSubmit = async (values: RegisterCustomerInput) => {
    try {
      const res = await createCustomer(values).unwrap();
      toast.success("Customer registered. Verify their documents next.");
      router.push(`/staff/customers/${res._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not register customer"));
    }
  };

  return (
    <>
      <Link href="/staff/customers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Customers
      </Link>
      <PageHeader title="Register customer" description="The customer signs in with this email and temporary password, then sets a transaction PIN." />
      <Card className="max-w-3xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Input label="Full name" {...register("name")} error={errors.name?.message} />
          <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
          <Input label="Phone" placeholder="+8801XXXXXXXXX" {...register("phone")} error={errors.phone?.message} />
          <Input label="National ID" {...register("nationalId")} error={errors.nationalId?.message} />
          <div className="sm:col-span-2">
            <Input label="Address" {...register("address")} error={errors.address?.message} />
          </div>
          <Input label="Temporary password" type="password" autoComplete="new-password" {...register("password")} error={errors.password?.message} hint="8+ characters, one uppercase letter and one number" />
          <div className="flex items-end sm:col-span-2">
            <Button type="submit" loading={isLoading}>
              Register customer
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}