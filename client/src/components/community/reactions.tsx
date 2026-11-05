'use client';

import { useOptimistic, useTransition } from 'react';
import { Flame, Heart, Sparkles, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { REACTIONS } from '@tunetracker/shared';
import { toggleReactionAction } from '@/features/community/actions';
import { cn } from '@/lib/utils';

const ICONS = { LIKE: ThumbsUp, FIRE: Flame, HEART: Heart, MIND_BLOWN: Sparkles } as const;
type Kind = keyof typeof REACTIONS;
type State = { counts: Record<string, number>; mine: string[] };

export function Reactions({
  postId,
  counts,
  mine,
}: {
  postId: string;
  counts: Record<string, number>;
  mine: string[];
}) {
  const [, start] = useTransition();
  const [state, toggle] = useOptimistic<State, Kind>({ counts, mine }, (s, kind) => {
    const on = s.mine.includes(kind);
    return {
      counts: { ...s.counts, [kind]: Math.max(0, (s.counts[kind] ?? 0) + (on ? -1 : 1)) },
      mine: on ? s.mine.filter((k) => k !== kind) : [...s.mine, kind],
    };
  });
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Reactions">
      {(Object.keys(REACTIONS) as Kind[]).map((kind) => {
        const Icon = ICONS[kind];
        const on = state.mine.includes(kind);
        const n = state.counts[kind] ?? 0;
        return (
          <li key={kind}>
            <button
              type="button"
              aria-pressed={on}
              aria-label={`${REACTIONS[kind]}${n ? `, ${n}` : ''}`}
              onClick={() =>
                start(async () => {
                  toggle(kind);
                  const r = await toggleReactionAction(postId, kind);
                  if (!r.ok) toast.error(r.error);
                })
              }
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors',
                on
                  ? 'border-electric bg-accent text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('size-3.5', on && 'text-electric')} aria-hidden />
              {n > 0 && <span className="type-figure">{n}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
