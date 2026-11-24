"use client";

import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Landmark, ShieldCheck } from "lucide-react";
import { loginSchema, type LoginValues } from "@/lib/validations/auth.schema";
import { APP_NAME, ROLE_HOME } from "@/lib/constants";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const DEMO = [
  { role: "Admin", email: "admin@bank.test", password: "Admin@1234" },
  { role: "Staff", email: "staff@bank.test", password: "Staff@1234" },
  { role: "Customer", email: "rahim@bank.test", password: "Customer@1234" },
];

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    const res = await signIn("credentials", { ...values, redirect: false });
    if (!res || res.error) {
      toast.error(res?.error && res.error !== "CredentialsSignin" ? res.error : "Invalid email or password");
      return;
    }
    const session = await getSession();
    router.replace(session?.user ? ROLE_HOME[session.user.role] : "/");
    router.refresh();
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
            <Landmark className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold">{APP_NAME}</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Banking that keeps every taka accounted for.</h2>
          <p className="mt-4 text-slate-400">Accounts, transfers, loans and approvals in one place, with every movement recorded.</p>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4" /> Simulated environment. No real money or cards.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Use your bank credentials to continue.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <Input label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
            <Input label="Password" type="password" autoComplete="current-password" {...register("password")} error={errors.password?.message} />
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-dashed border-slate-200 p-4 dark:border-white/10">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Demo accounts</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {DEMO.map((d) => (
                <Button
                  key={d.role}
                  variant="secondary"
                  className="px-2 text-xs"
                  onClick={() => {
                    setValue("email", d.email);
                    setValue("password", d.password);
                  }}
                >
                  {d.role}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
