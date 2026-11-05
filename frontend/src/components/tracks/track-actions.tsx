'use client';

import { useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import { Download, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { sampleDownloadAction, setTrackLikeAction } from '@/features/tracks/actions';
import { cn } from '@/lib/utils';

export function LikeButton({
  trackId,
  liked,
  count,
  signedIn,
}: {
  trackId: string;
  liked: boolean;
  count: number;
  signedIn: boolean;
}) {
  const [base, setBase] = useState({ liked, count });
  const [state, setOptimistic] = useOptimistic(base);
  const [, start] = useTransition();
  if (!signedIn) {
    return (
      <Button asChild variant="outline">
        <Link href={`/login?next=/tracks/${trackId}`}>
          <Heart aria-hidden /> Like · {count}
        </Link>
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      aria-pressed={state.liked}
      data-testid="like-button"
      onClick={() =>
        start(async () => {
          const next = { liked: !state.liked, count: state.count + (state.liked ? -1 : 1) };
          setOptimistic(next);
          const r = await setTrackLikeAction(trackId, next.liked);
          if (r.ok) setBase({ liked: r.data.liked, count: r.data.likeCount });
          else toast.error(r.error);
        })
      }
    >
      <Heart aria-hidden className={cn(state.liked && 'fill-current text-violet')} />
      {state.liked ? 'Liked' : 'Like'} · <span className="type-figure">{state.count}</span>
    </Button>
  );
}

export function DownloadButton({ trackId }: { trackId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await sampleDownloadAction(trackId);
          if (r.ok) window.location.assign(r.data.url);
          else toast.error(r.error);
        })
      }
    >
      <Download aria-hidden /> {pending ? 'Preparing…' : 'Download sample'}
    </Button>
  );
}
