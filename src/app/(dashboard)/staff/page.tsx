"use client";

import Link from "next/link";
import { ArrowRight, HandCoins, Inbox, UserPlus, Users } from "lucide-react";
import { useGetRequestsQuery } from "@/store/features/requests/requestApi";
import { useGetLoansQuery } from "@/store/features/loans/loanApi";
import { useGetCustomersQuery } from "@/store/features/customers/customerApi";
import { useAppSelector } from "@/store/hooks";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";

const QUICK = [
  { href: "/staff/customers/new", title: "Register a customer", desc: "Create a profile, then verify and open an account.", icon: UserPlus },
  { href: "/staff/requests", title: "Review requests", desc: "Approve or reject deposits and withdrawals.", icon: Inbox },
  { href: "/staff/loans", title: "Loan applications", desc: "Add notes and forward to admin.", icon: HandCoins },
];

export default function StaffOverview() {
  const user = useAppSelector((s) => s.auth.user);
  const requests = useGetRequestsQuery({ status: "PENDING" });
  const loans = useGetLoansQuery({ status: "PENDING" });
  const customers = useGetCustomersQuery();

  return (
    <>
      <PageHeader title={`Good day, ${user?.name.split(" ")[0] ?? ""}`} description="Your work queue for today." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending requests" value={requests.data?.total ?? 0} icon={Inbox} tone="amber" loading={requests.isLoading} />
        <StatCard label="Loans to review" value={loans.data?.total ?? 0} icon={HandCoins} tone="sky" loading={loans.isLoading} />
        <StatCard label="Customers" value={customers.data?.total ?? 0} icon={Users} tone="brand" loading={customers.isLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {QUICK.map(({ href, title, desc, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="group h-full transition hover:-translate-y-0.5 hover:shadow-md">
              <Icon className="h-5 w-5 text-brand-600" />
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
              <ArrowRight className="mt-4 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-600" />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}