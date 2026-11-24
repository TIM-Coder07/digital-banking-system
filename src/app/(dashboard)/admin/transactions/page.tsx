import { PageHeader } from "@/components/ui/PageHeader";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export default function AdminTransactionsPage() {
  return (
    <>
      <PageHeader title="Transactions" description="Every transaction across the bank." />
      <TransactionsView allowFlag />
    </>
  );
}