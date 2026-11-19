import clsx from "clsx";
import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: string;
}

export function Checkbox({ label, description, id, className, ...props }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={clsx("flex items-start gap-2", className)}>
      <input
        id={inputId}
        type="checkbox"
        className="border-line-strong accent-brand-600 mt-0.5 h-4 w-4 shrink-0 rounded"
        {...props}
      />
      <label htmlFor={inputId} className="text-ink text-sm">
        {label}
        {description && <span className="text-ink-muted mt-0.5 block text-xs">{description}</span>}
      </label>
    </div>
  );
}
