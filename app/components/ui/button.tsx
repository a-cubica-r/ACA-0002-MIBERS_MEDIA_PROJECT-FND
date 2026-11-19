import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonClassesOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: ButtonClassesOptions = {}) {
  return clsx(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
    "disabled:pointer-events-none disabled:opacity-60",
    {
      "bg-brand-600 text-white hover:bg-brand-700": variant === "primary",
      "border border-line-strong bg-surface text-ink hover:bg-surface-muted":
        variant === "secondary",
      "bg-transparent text-ink hover:bg-surface-muted": variant === "ghost",
      "bg-danger-600 text-white hover:bg-danger-700": variant === "danger",
      "px-3 py-1.5 text-sm": size === "sm",
      "px-4 py-2 text-sm": size === "md",
    },
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
