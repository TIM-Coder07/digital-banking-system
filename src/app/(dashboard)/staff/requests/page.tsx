import { PageHeader } from "@/components/ui/PageHeader";
import { RequestsReview } from "@/components/requests/RequestsReview";

export default function StaffRequestsPage() {
  return (
    <>
      <PageHeader title="Deposit & withdrawal requests" description="Approving a request moves the money and records a transaction." />
      <RequestsReview />
    </>
  );
}