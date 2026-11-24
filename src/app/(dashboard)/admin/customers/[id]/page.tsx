"use client";

import { useParams } from "next/navigation";
import { CustomerDetail } from "@/components/customers/CustomerDetail";

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <CustomerDetail id={id} backHref="/admin/customers" accountHrefBase="/admin/accounts" canManageStatus />;
}