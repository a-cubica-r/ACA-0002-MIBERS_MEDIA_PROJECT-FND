import clsx from "clsx";
import type { HTMLAttributes } from "react";

export type AlertTone = "info" | "success" | "warning" | "danger";

const toneClasses: Record<AlertTone, { box: string; title: string }> = {
  info: { box: "border-info-700/20 bg-info-50", title: "text-info-700" },
  success: { box: "border-success-700/20 bg-success-50", title: "text-success-700" },
  warning: { box: "border-warning-700/20 bg-warning-50", title: "text-warning-700" },
  danger: { box: "border-danger-700/20 bg-danger-50", title: "text-danger-700" },
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  title?: string;
}

export function Alert({ tone = "info", title, className, children, ...props }: AlertProps) {
  const styles = toneClasses[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={clsx("rounded-lg border px-4 py-3", styles.box, className)}
      {...props}
    >
      {title && <p className={clsx("text-sm font-medium", styles.title)}>{title}</p>}
      <div className={clsx("text-ink text-sm", title && "mt-1")}>{children}</div>
    </div>
  );
}
