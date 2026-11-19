import clsx from "clsx";
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export function Table({ containerClassName, className, ...props }: TableProps) {
  return (
    <div
      className={clsx(
        "border-line bg-surface overflow-x-auto rounded-xl border",
        containerClassName,
      )}
    >
      <table className={clsx("w-full border-collapse text-left", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={clsx("bg-surface-muted", className)} {...props} />;
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={clsx("border-line border-t first:border-t-0", className)} {...props} />;
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={clsx(
        "text-ink-muted px-4 py-3 text-xs font-medium tracking-wide uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={clsx("text-ink px-4 py-3 text-sm", className)} {...props} />;
}
