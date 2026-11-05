'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { AnimateIcon } from '@animate-ui/react/icons';
import { IconButton, IconButtonParticles } from '@animate-ui/react/primitives/buttons/icon';
import { FlameIcon } from '@/components/animate-ui/icons/flame';
import { HeartIcon } from '@/components/animate-ui/icons/heart';
import { SparklesIcon } from '@/components/animate-ui/icons/sparkles';
import { ThumbsUpIcon } from '@/components/animate-ui/icons/thumbs-up';
import { toast } from 'sonner';
import { REACTIONS } from '@tunetracker/shared';
import { toggleReactionAction } from '@/features/community/actions';
import { cn } from '@/lib/utils';

const ICONS = { LIKE: ThumbsUpIcon, FIRE: FlameIcon, HEART: HeartIcon, MIND_BLOWN: SparklesIcon } as const;
type Kind = keyof typeof REACTIONS;
type State = { counts: Record<string, number>; mine: string[] };

export function applyToggle(s: State, kind: Kind): State {
  const on = s.mine.includes(kind);
  return {
    counts: { ...s.counts, [kind]: Math.max(0, (s.counts[kind] ?? 0) + (on ? -1 : 1)) },
    mine: on ? s.mine.filter((k) => k !== kind) : [...s.mine, kind],
  };
}

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
  // Confirmed state lives here; useOptimistic only covers the pending request, so a successful
  // reaction stays applied after the transition ends (the action does not refresh these props).
  const [base, setBase] = useState<State>({ counts, mine });
  const [state, toggle] = useOptimistic<State, Kind>(base, applyToggle);
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Reactions">
      {(Object.keys(REACTIONS) as Kind[]).map((kind) => {
        const Icon = ICONS[kind];
        const on = state.mine.includes(kind);
        const n = state.counts[kind] ?? 0;
        return (
          <li key={kind}>
            {/* Animate UI Icon Button: press spring, the icon plays and particles burst when turned on */}
            <AnimateIcon animateOnTap asChild>
              <IconButton
                type="button"
                aria-pressed={on}
                aria-label={`${REACTIONS[kind]}${n ? `, ${n}` : ''}`}
                onClick={() =>
                  start(async () => {
                    toggle(kind);
                    const r = await toggleReactionAction(postId, kind);
                    if (r.ok) setBase((b) => applyToggle(b, kind));
                    else toast.error(r.error);
                  })
                }
                className={cn(
                  'relative inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors',
                  on
                    ? 'border-electric bg-accent text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('size-3.5', on && 'text-electric')} aria-hidden />
                {n > 0 && <span className="type-figure">{n}</span>}
                {on && <IconButtonParticles className="text-electric" />}
              </IconButton>
            </AnimateIcon>
          </li>
        );
      })}
    </ul>
  );
}
