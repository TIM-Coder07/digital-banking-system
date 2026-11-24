import { PageHeader } from "@/components/ui/PageHeader";
import { LoansTable } from "@/components/loans/LoansTable";

export default function StaffLoansPage() {
  return (
    <>
      <PageHeader title="Loan applications" description="Review applicants, add notes and forward to admin." />
      <LoansTable basePath="/staff/loans" defaultStatus="PENDING" />
    </>
  );
}