"use client";

import Link from "next/link";
import { useGetAccountsQuery } from "@/store/features/accounts/accountApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccountCard } from "@/components/accounts/AccountCard";
import { formatMoney } from "@/lib/format";

export default function CustomerAccountsPage() {
  const { data, isLoading } = useGetAccountsQuery();
  const accounts = data?.items ?? [];
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <>
      <PageHeader title="My accounts" description={accounts.length ? `Combined balance ${formatMoney(total)}` : undefined} />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : !accounts.length ? (
        <EmptyState title="No accounts yet" description="Visit a branch to open your first account." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => (
            <Link key={a._id} href={`/customer/accounts/${a._id}`} className="transition hover:-translate-y-0.5">
              <AccountCard account={a} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}