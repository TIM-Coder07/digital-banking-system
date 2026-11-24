import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Bell,
  HandCoins,
  Inbox,
  LayoutDashboard,
  Receipt,
  Send,
  Settings,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";
import type { Role } from "@/lib/constants";

export type NavItem = { label: string; href: string; icon: LucideIcon };

export const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Accounts", href: "/admin/accounts", icon: Wallet },
    { label: "Transactions", href: "/admin/transactions", icon: ArrowLeftRight },
    { label: "Requests", href: "/admin/requests", icon: Inbox },
    { label: "Loans", href: "/admin/loans", icon: HandCoins },
    { label: "Flagged", href: "/admin/flagged", icon: ShieldAlert },
    { label: "Bank Settings", href: "/admin/settings", icon: Settings },
  ],
  STAFF: [
    { label: "Overview", href: "/staff", icon: LayoutDashboard },
    { label: "Customers", href: "/staff/customers", icon: Users },
    { label: "Transactions", href: "/staff/transactions", icon: ArrowLeftRight },
    { label: "Requests", href: "/staff/requests", icon: Inbox },
    { label: "Loans", href: "/staff/loans", icon: HandCoins },
  ],
  CUSTOMER: [
    { label: "Dashboard", href: "/customer", icon: LayoutDashboard },
    { label: "Accounts", href: "/customer/accounts", icon: Wallet },
    { label: "Transfer", href: "/customer/transfer", icon: Send },
    { label: "Deposit & Withdraw", href: "/customer/requests", icon: Inbox },
    { label: "Transactions", href: "/customer/transactions", icon: Receipt },
    { label: "Loans", href: "/customer/loans", icon: HandCoins },
    { label: "Notifications", href: "/customer/notifications", icon: Bell },
    { label: "Settings", href: "/customer/settings", icon: Settings },
  ],
};
