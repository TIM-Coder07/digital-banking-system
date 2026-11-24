import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-semibold text-brand-600">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
        <Link href="/" className="mt-6 inline-block text-sm text-brand-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
