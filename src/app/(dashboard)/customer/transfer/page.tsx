import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TransferForm } from "@/components/transfer/TransferForm";

export default function TransferPage() {
  return (
    <>
      <PageHeader title="Send money" description="Between your own accounts or to another customer of the bank." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <TransferForm />
        </Card>
        <Card className="h-fit space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-100">Before you send</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Check the 12 digit account number carefully.</li>
            <li>Daily and per transfer limits apply.</li>
            <li>A minimum balance must stay in your account.</li>
            <li>Never share your transaction PIN with anyone, including bank staff.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
