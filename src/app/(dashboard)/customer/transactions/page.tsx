import { PageHeader } from "@/components/ui/PageHeader";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export default function CustomerTransactionsPage() {
  return (
    <>
      <PageHeader title="Transactions" description="All money in and out of your accounts." />
      <TransactionsView detailBase="/customer/transactions" />
    </>
  );
}
