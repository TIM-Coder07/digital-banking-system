import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldClass } from "./Input";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string };

export const Select = forwardRef<HTMLSelectElement, Props>(function Select({ label, error, className, id, children, ...props }, ref) {
  const selectId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </label>
      )}
      <select ref={ref} id={selectId} className={cn(fieldClass, error && "border-rose-400", className)} {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
});
