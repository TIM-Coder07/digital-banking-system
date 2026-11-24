"use client";

import { useParams } from "next/navigation";
import { LoanReview } from "@/components/loans/LoanReview";

export default function AdminLoanReviewPage() {
  const { id } = useParams<{ id: string }>();
  return <LoanReview id={id} mode="ADMIN" backHref="/admin/loans" />;
}