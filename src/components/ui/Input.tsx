import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: ReactNode; prefix?: string };

export const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-white/10 dark:bg-ink-900 dark:text-slate-100";

export const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, error, hint, prefix, className, id, ...props }, ref) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(fieldClass, prefix && "pl-12", error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20", className)}
          {...props}
        />
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
});
