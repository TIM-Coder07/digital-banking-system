import { PageHeader } from "@/components/ui/PageHeader";
import { FlaggedView } from "@/components/transactions/FlaggedView";

export default function FlaggedPage() {
  return (
    <>
      <PageHeader title="Flagged transactions" description="Flagged by staff or by the automatic rules. Review, clear or freeze." />
      <FlaggedView />
    </>
  );
}