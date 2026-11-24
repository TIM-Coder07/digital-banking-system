import Link from "next/link";
import { TodoCard } from "@/components/ui/TodoCard";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-lg space-y-6 p-6 pt-16">
      <h1 className="text-2xl font-semibold">Open an account</h1>
      <TodoCard
        items={[
          "Form with name, email, phone, address, national ID, password (registerCustomerSchema)",
          "On success show 'Visit a branch to verify your identity' and link to login",
        ]}
        hooks={["useRegisterMutation"]}
      />
      <Link href="/login" className="text-sm text-brand-600 hover:underline">
        Back to sign in
      </Link>
    </main>
  );
}
