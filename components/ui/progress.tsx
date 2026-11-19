import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div
      aria-label="Progression du profil"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={safeValue}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
      role="progressbar"
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width]", indicatorClassName)}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
