import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={clsx(
        "bg-surface text-ink placeholder:text-ink-subtle w-full rounded-lg border px-3 py-2 text-sm transition-colors",
        "disabled:bg-surface-muted disabled:text-ink-muted disabled:cursor-not-allowed",
        invalid
          ? "border-danger-600 focus:border-danger-600"
          : "border-line-strong focus:border-brand-500",
        className,
      )}
      {...props}
    />
  );
}
