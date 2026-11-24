"use client";

import { ArrowDownLeft, ArrowUpRight, HandCoins, Landmark, Receipt, Users, Wallet } from "lucide-react";
import { useGetAdminAnalyticsQuery } from "@/store/features/analytics/analyticsApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import { MonthlyChart } from "@/components/charts/MonthlyChart";
import { DistributionChart } from "@/components/charts/DistributionChart";
import { formatCompactMoney, formatMoney } from "@/lib/format";

export default function AdminDashboard() {
  const { data, isLoading } = useGetAdminAnalyticsQuery();
  const t = data?.totals;

  return (
    <>
      <PageHeader title="Bank overview" description="Live figures from all accounts and transactions." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total balance" value={t ? formatMoney(t.totalBalance) : ""} icon={Landmark} tone="brand" loading={isLoading} />
        <StatCard label="Customers" value={t?.customers ?? ""} icon={Users} tone="sky" loading={isLoading} />
        <StatCard label="Accounts" value={t?.accounts ?? ""} icon={Wallet} tone="slate" loading={isLoading} />
        <StatCard label="Pending loans" value={t?.pendingLoans ?? ""} icon={HandCoins} tone="amber" loading={isLoading} />
        <StatCard label="Total deposits" value={t ? formatCompactMoney(t.deposits) : ""} icon={ArrowDownLeft} tone="brand" loading={isLoading} />
        <StatCard label="Total withdrawals" value={t ? formatCompactMoney(t.withdrawals) : ""} icon={ArrowUpRight} tone="rose" loading={isLoading} />
        <StatCard label="Transactions" value={t?.transactions ?? ""} icon={Receipt} tone="slate" loading={isLoading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>Monthly transaction volume</CardTitle>
          {isLoading ? <Skeleton className="h-72" /> : (
            <MonthlyChart data={data?.monthly ?? []} series={[{ key: "transfer", label: "Transfers", color: "#0284c7" }, { key: "loan", label: "Loans", color: "#7c3aed" }]} />
          )}
        </Card>
        <Card>
          <CardTitle>Deposit vs withdrawal</CardTitle>
          {isLoading ? <Skeleton className="h-72" /> : (
            <MonthlyChart data={data?.monthly ?? []} series={[{ key: "deposit", label: "Deposits", color: "#059669" }, { key: "withdrawal", label: "Withdrawals", color: "#e11d48" }]} />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Account distribution</CardTitle>
          {isLoading ? <Skeleton className="h-44" /> : (
            <DistributionChart data={(data?.accountDistribution ?? []).map((a) => ({ name: a.type, value: a.count }))} valueLabel="accounts" />
          )}
        </Card>
        <Card>
          <CardTitle>Loan approval statistics</CardTitle>
          {isLoading ? <Skeleton className="h-44" /> : (
            <DistributionChart data={(data?.loanStats ?? []).map((l) => ({ name: l.status, value: l.count }))} valueLabel="loans" />
          )}
        </Card>
        <Card>
          <CardTitle>Monthly banking activity</CardTitle>
          {isLoading ? <Skeleton className="h-44" /> : (
            <MonthlyChart height={190} money={false} data={data?.monthly ?? []} series={[{ key: "count", label: "Transactions", color: "#0f172a" }]} />
          )}
        </Card>
      </div>
    </>
  );
}
