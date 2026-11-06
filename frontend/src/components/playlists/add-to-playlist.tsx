'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ListPlus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createPlaylistAction, setPlaylistTrackAction } from '@/features/playlists/actions';

type Mine = { id: string; title: string; hasTrack: boolean };

/** Toggle a track in any of your playlists, or start a new one with it. */
export function AddToPlaylist({
  trackId,
  trackTitle,
  playlists,
}: {
  trackId: string;
  trackTitle: string;
  playlists: Mine[] | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState(playlists ?? []);
  const [, start] = useTransition();
  if (!playlists) {
    return (
      <Button asChild variant="outline">
        <Link href={`/login?next=/tracks/${trackId}`}>
          <ListPlus aria-hidden /> Add to playlist
        </Link>
      </Button>
    );
  }
  const toggle = (p: Mine) =>
    start(async () => {
      const r = await setPlaylistTrackAction(p.id, trackId, !p.hasTrack);
      if (!r.ok) return void toast.error(r.error);
      setItems((all) => all.map((x) => (x.id === p.id ? { ...x, hasTrack: !x.hasTrack } : x)));
      toast.success(p.hasTrack ? `Removed from “${p.title}”` : `Added to “${p.title}”`);
    });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <ListPlus aria-hidden /> Add to playlist
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="type-role text-muted-foreground">Your playlists</DropdownMenuLabel>
        {items.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onSelect={() => toggle(p)}
            aria-checked={p.hasTrack}
            role="menuitemcheckbox"
          >
            <span className="min-w-0 flex-1 truncate">{p.title}</span>
            {p.hasTrack && <Check className="size-4 text-electric" aria-hidden />}
          </DropdownMenuItem>
        ))}
        {items.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem
          onSelect={() =>
            start(async () => {
              const title = trackTitle.slice(0, 90);
              const r = await createPlaylistAction({ title: `${title} — playlist` }, trackId);
              if (!r.ok) return void toast.error(r.error);
              setItems((all) => [{ id: r.data.id, title: `${title} — playlist`, hasTrack: true }, ...all]);
              toast.success('New playlist created', {
                action: { label: 'Open', onClick: () => router.push(`/playlists/${r.data.id}`) },
              });
            })
          }
        >
          <Plus className="size-4" aria-hidden /> New playlist with this track
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
