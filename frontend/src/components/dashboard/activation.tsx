import Link from 'next/link';
import { Check } from 'lucide-react';

type Step = { key: string; label: string; href: string; done: boolean };

/** First-run checklist; disappears once every step is done. */
export function Activation({ steps, completed }: { steps: Step[]; completed: number }) {
  if (completed === steps.length) return null;
  return (
    <section aria-labelledby="activation" className="sheet mb-10 p-5" data-testid="activation">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="activation" className="type-title text-xl">
          Set up your studio
        </h2>
        <span className="type-figure text-sm text-muted-foreground">
          {completed}/{steps.length}
        </span>
      </div>
      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Setup progress"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={steps.length}
      >
        <div
          className="h-full"
          style={{ width: `${(completed / steps.length) * 100}%`, backgroundImage: 'var(--gradient-light)' }}
        />
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.key}>
            {s.done ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground line-through decoration-rule">
                <Check className="size-4 text-success" aria-hidden /> {s.label}
                <span className="sr-only">(done)</span>
              </span>
            ) : (
              <Link href={s.href} className="flex items-center gap-2 text-sm font-medium hover:text-electric">
                <span className="size-4 rounded-full border border-rule" aria-hidden /> {s.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
