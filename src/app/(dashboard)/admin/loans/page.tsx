import { PageHeader } from "@/components/ui/PageHeader";
import { LoansTable } from "@/components/loans/LoansTable";

export default function AdminLoansPage() {
  return (
    <>
      <PageHeader title="Loan applications" description="Applications forwarded by staff appear under Under Review." />
      <LoansTable basePath="/admin/loans" defaultStatus="UNDER_REVIEW" />
    </>
  );
}