'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type Point = { day: string; plays: number };

const label = (day: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' });

/** A round top for the y axis that keeps the tallest bar above half height. */
function niceMax(v: number) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((m) => m * p >= v) ?? 10) * p;
}

/**
 * Plays per day. One series in the brand electric (validated ≥3:1 on both themes' surfaces), thin
 * bars with 2px gaps and rounded data ends on a recessive grid. Hover any day, or focus the chart
 * and use ←/→, to read its value; the same numbers are available as a table.
 */
export function PlaysChart({ series }: { series: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...series.map((s) => s.plays)));
  const total = series.reduce((n, s) => n + s.plays, 0);
  const peak = series.reduce((best, s) => (s.plays > best.plays ? s : best), series[0]!);
  const shown = active ?? null;
  const ticks = [0, Math.round(series.length / 2), series.length - 1];

  return (
    <figure className="grid gap-3">
      <div className="flex gap-3">
        {/* y axis: recessive, two labels only */}
        <div
          className="type-figure flex h-48 flex-col justify-between text-right text-[11px] text-muted-foreground"
          aria-hidden
        >
          <span>{max}</span>
          <span>0</span>
        </div>
        <div
          className="relative h-48 flex-1 rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          role="img"
          tabIndex={0}
          aria-label={`Plays per day over ${series.length} days: ${total} in total, peak ${peak.plays} on ${label(peak.day)}. Use the left and right arrow keys to read each day.`}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End')
              return;
            e.preventDefault();
            const last = series.length - 1;
            setActive((i) =>
              e.key === 'Home'
                ? 0
                : e.key === 'End'
                  ? last
                  : Math.min(last, Math.max(0, (i ?? last) + (e.key === 'ArrowLeft' ? -1 : 1))),
            );
          }}
          onBlur={() => setActive(null)}
          onMouseLeave={() => setActive(null)}
        >
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-rule" aria-hidden />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-rule" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 border-t border-border" aria-hidden />
          <div className="absolute inset-0 flex items-end gap-[2px]" aria-hidden>
            {series.map((s, i) => (
              // full-height hit target, bigger than the bar it reveals
              <div
                key={s.day}
                className="relative flex h-full min-w-0 flex-1 items-end"
                onMouseEnter={() => setActive(i)}
              >
                <div
                  className={cn(
                    'w-full rounded-t-[4px] transition-opacity',
                    shown !== null && shown !== i && 'opacity-45',
                  )}
                  style={{
                    height: `${(s.plays / max) * 100}%`,
                    minHeight: s.plays > 0 ? 2 : 0,
                    background: 'var(--electric)',
                  }}
                />
              </div>
            ))}
          </div>
          {shown !== null && (
            <div
              className="pointer-events-none absolute top-1 z-10 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap shadow-(--shadow-sheet)"
              style={{
                left: `${((shown + 0.5) / series.length) * 100}%`,
                transform: `translateX(${shown > series.length * 0.7 ? '-100%' : shown < series.length * 0.3 ? '0' : '-50%'})`,
              }}
              role="status"
            >
              <span className="block text-muted-foreground">
                {label(series[shown]!.day, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="type-figure text-sm text-foreground">
                {series[shown]!.plays} {series[shown]!.plays === 1 ? 'play' : 'plays'}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="type-figure relative ml-9 h-4 text-[11px] text-muted-foreground" aria-hidden>
        {ticks.map((i, k) => (
          <span
            key={i}
            className="absolute whitespace-nowrap"
            style={{
              left: `${((i + 0.5) / series.length) * 100}%`,
              transform: `translateX(${k === 0 ? '0' : k === 2 ? '-100%' : '-50%'})`,
            }}
          >
            {label(series[i]!.day)}
          </span>
        ))}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Show as table
        </summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-md border border-border">
          <table className="w-full text-left">
            <thead className="type-role sticky top-0 bg-stock-2 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Day</th>
                <th className="px-3 py-2 text-right font-semibold">Plays</th>
              </tr>
            </thead>
            <tbody>
              {[...series].reverse().map((s) => (
                <tr key={s.day} className="border-t border-border">
                  <td className="px-3 py-1.5">
                    {label(s.day, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="type-figure px-3 py-1.5 text-right">{s.plays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
