import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        {breadcrumb && <div className="text-ink-muted mb-1 text-xs">{breadcrumb}</div>}
        <h1 className="text-ink text-xl font-semibold sm:text-2xl">{title}</h1>
        {description && <p className="text-ink-muted mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
