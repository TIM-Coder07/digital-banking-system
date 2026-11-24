"use client";

import { useParams } from "next/navigation";
import { CustomerDetail } from "@/components/customers/CustomerDetail";

export default function StaffCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <CustomerDetail id={id} backHref="/staff/customers" />;
}