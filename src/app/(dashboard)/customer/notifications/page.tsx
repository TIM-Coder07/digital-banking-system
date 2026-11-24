"use client";

import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { useGetNotificationsQuery, useMarkAllReadMutation } from "@/store/features/notifications/notificationApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { data, isLoading } = useGetNotificationsQuery();
  const [markAll, { isLoading: marking }] = useMarkAllReadMutation();

  return (
    <>
      <PageHeader
        title="Notifications"
        description={data?.unread ? `${data.unread} unread` : "You are all caught up."}
        actions={
          !!data?.unread && (
            <Button variant="secondary" onClick={() => markAll()} loading={marking}>
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </Button>
          )
        }
      />
      <Card className="p-0">
        {isLoading ? (
          <Skeleton className="m-5 h-40" />
        ) : !data?.items.length ? (
          <div className="p-5">
            <EmptyState title="No notifications" />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {data.items.map((n) => {
              const body = (
                <div className={cn("flex gap-3 px-5 py-4", !n.read && "bg-brand-50/40 dark:bg-brand-500/5")}>
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand-500")} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                  </div>
                </div>
              );
              return <li key={n._id}>{n.link ? <Link href={n.link} className="block hover:bg-slate-50 dark:hover:bg-white/[0.02]">{body}</Link> : body}</li>;
            })}
          </ul>
        )}
      </Card>
    </>
  );
}