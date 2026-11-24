import { PageHeader } from "@/components/ui/PageHeader";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export default function StaffTransactionsPage() {
  return (
    <>
      <PageHeader title="Transactions" description="Search by ID, filter by type and date, flag anything suspicious." />
      <TransactionsView allowFlag />
    </>
  );
}