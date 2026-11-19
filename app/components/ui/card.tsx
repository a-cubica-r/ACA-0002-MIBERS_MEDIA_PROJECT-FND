import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

type DivProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={clsx("border-line bg-surface rounded-xl border shadow-sm", className)}
      {...props}
    />
  );
}

export interface CardHeaderProps extends DivProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function CardHeader({ title, description, actions, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={clsx(
        "border-line flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        <h2 className="text-ink text-base font-semibold">{title}</h2>
        {description && <p className="text-ink-muted mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: DivProps) {
  return <div className={clsx("p-4 sm:p-6", className)} {...props} />;
}
