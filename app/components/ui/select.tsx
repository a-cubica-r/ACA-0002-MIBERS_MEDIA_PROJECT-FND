import clsx from "clsx";
import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid = false, className, children, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={clsx(
        "bg-surface text-ink w-full rounded-lg border px-3 py-2 pr-8 text-sm transition-colors",
        "disabled:bg-surface-muted disabled:text-ink-muted disabled:cursor-not-allowed",
        invalid
          ? "border-danger-600 focus:border-danger-600"
          : "border-line-strong focus:border-brand-500",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
