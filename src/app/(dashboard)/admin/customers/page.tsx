import { PageHeader } from "@/components/ui/PageHeader";
import { CustomersView } from "@/components/customers/CustomersView";

export default function AdminCustomersPage() {
  return (
    <>
      <PageHeader title="Customers" description="Search, review, activate, deactivate or block customers." />
      <CustomersView basePath="/admin/customers" registerHref="/staff/customers/new" />
    </>
  );
}