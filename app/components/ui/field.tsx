import clsx from "clsx";
import type { ReactNode } from "react";

export interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
  className,
}: FieldProps) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-ink text-sm font-medium">
        {label}
        {required && <span className="text-danger-700"> *</span>}
      </label>
      {children}
      {hint && <p className="text-ink-muted text-xs">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-danger-700 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
