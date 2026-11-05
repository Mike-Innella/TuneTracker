import { cn } from '@/lib/utils';

/** Thin progress rule; the filled part carries the logo light. */
export function ProgressLine({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      {/* solid at rest: the logo light is reserved for drags and primary actions */}
      <div className="h-full rounded-full bg-foreground/70" style={{ width: `${value}%` }} />
    </div>
  );
}
