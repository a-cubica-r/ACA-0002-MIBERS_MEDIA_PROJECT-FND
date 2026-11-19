import clsx from "clsx";
import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid = false, className, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={clsx(
        "bg-surface text-ink placeholder:text-ink-subtle min-h-24 w-full resize-y rounded-lg border px-3 py-2 text-sm transition-colors",
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
