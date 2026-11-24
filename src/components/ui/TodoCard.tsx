import { Card } from "./Card";

/** Placeholder used by pages that are scaffolded but not built yet. Delete once done. */
export function TodoCard({ items, hooks }: { items: string[]; hooks?: string[] }) {
  return (
    <Card className="border-dashed">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">To build</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      {hooks && (
        <p className="mt-4 text-xs text-slate-500">
          Hooks: <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-white/5">{hooks.join(", ")}</code>
        </p>
      )}
    </Card>
  );
}
