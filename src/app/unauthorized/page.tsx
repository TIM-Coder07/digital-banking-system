import Link from "next/link";

export default function Unauthorized() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-semibold text-rose-600">403</p>
        <h1 className="mt-2 text-2xl font-semibold">You do not have access to this page</h1>
        <Link href="/" className="mt-6 inline-block text-sm text-brand-600 hover:underline">
          Go to my dashboard
        </Link>
      </div>
    </main>
  );
}
