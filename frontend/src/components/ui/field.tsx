import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Label + control + inline error wired with aria-describedby. */
export function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string[] | string;
  hint?: string;
  className?: string;
  children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => React.ReactNode;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  const describedBy = message ? `${id}-error` : hint ? `${id}-hint` : undefined;
  // content-start: when a row neighbour has a hint/error, extra height stays below the input
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      <Label htmlFor={id} className="type-role text-muted-foreground">
        {label}
      </Label>
      {children({ id, 'aria-invalid': message ? true : undefined, 'aria-describedby': describedBy })}
      {message ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {message}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
