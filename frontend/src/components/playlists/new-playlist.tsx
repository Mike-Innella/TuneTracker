'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPlaylistAction } from '@/features/playlists/actions';

export function NewPlaylist() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const title = String(new FormData(form).get('title') ?? '').trim();
        if (!title) return;
        start(async () => {
          const r = await createPlaylistAction({ title });
          if (!r.ok) return void toast.error(r.error);
          form.reset();
          router.push(`/playlists/${r.data.id}`);
        });
      }}
    >
      <Input
        name="title"
        aria-label="New playlist title"
        placeholder="New playlist"
        maxLength={100}
        className="h-9"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        <Plus aria-hidden /> Create
      </Button>
    </form>
  );
}
