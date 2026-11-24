"use client";

import { useParams } from "next/navigation";
import { LoanReview } from "@/components/loans/LoanReview";

export default function StaffLoanReviewPage() {
  const { id } = useParams<{ id: string }>();
  return <LoanReview id={id} mode="STAFF" backHref="/staff/loans" />;
}