import clsx from "clsx";
import { Link } from "react-router";

export interface PaginationProps {
  page: number;
  pageSize: number;
  count: number;
  hrefFor: (page: number) => string;
  className?: string;
}

const linkClasses =
  "inline-flex items-center rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted";
const disabledClasses =
  "inline-flex items-center rounded-lg border border-line px-3 py-1.5 text-sm text-ink-subtle";

export function Pagination({ page, pageSize, count, hrefFor, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Paginación"
      className={clsx("flex flex-col items-center justify-between gap-3 sm:flex-row", className)}
    >
      <p className="text-ink-muted text-sm">
        {count === 0 ? "Mostrando 0 de 0" : `Mostrando ${start}–${end} de ${count}`}
      </p>
      <div className="flex items-center gap-2">
        {hasPrevious ? (
          <Link to={hrefFor(page - 1)} className={linkClasses} rel="prev">
            Anterior
          </Link>
        ) : (
          <span className={disabledClasses} aria-disabled="true">
            Anterior
          </span>
        )}
        {hasNext ? (
          <Link to={hrefFor(page + 1)} className={linkClasses} rel="next">
            Siguiente
          </Link>
        ) : (
          <span className={disabledClasses} aria-disabled="true">
            Siguiente
          </span>
        )}
      </div>
    </nav>
  );
}
