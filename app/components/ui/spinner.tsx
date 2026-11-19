import clsx from "clsx";
import type { SVGProps } from "react";

export type SpinnerSize = "sm" | "md";

export interface SpinnerProps extends SVGProps<SVGSVGElement> {
  size?: SpinnerSize;
}

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <svg
      role="status"
      aria-label="Cargando"
      viewBox="0 0 24 24"
      fill="none"
      className={clsx("animate-spin", size === "sm" ? "h-4 w-4" : "h-5 w-5", className)}
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
