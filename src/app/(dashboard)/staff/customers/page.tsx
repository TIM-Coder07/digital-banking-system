import { PageHeader } from "@/components/ui/PageHeader";
import { CustomersView } from "@/components/customers/CustomersView";

export default function StaffCustomersPage() {
  return (
    <>
      <PageHeader title="Customers" description="Register, verify and look up customers." />
      <CustomersView basePath="/staff/customers" registerHref="/staff/customers/new" />
    </>
  );
}