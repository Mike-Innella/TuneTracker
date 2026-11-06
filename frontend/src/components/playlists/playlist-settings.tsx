'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { deletePlaylistAction, updatePlaylistAction } from '@/features/playlists/actions';

export function PlaylistSettings({
  id,
  title,
  description,
  visibility,
}: {
  id: string;
  title: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Edit details
      </Button>
    );
  }
  return (
    <form
      className="mt-4 grid w-full max-w-lg gap-4 rounded-md border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        start(async () => {
          const r = await updatePlaylistAction(id, {
            title: String(f.get('title') ?? ''),
            description: String(f.get('description') ?? '') || null,
            visibility: f.get('visibility') === 'on' ? 'PUBLIC' : 'PRIVATE',
          });
          if (!r.ok) return void toast.error(r.error);
          setOpen(false);
          router.refresh();
        });
      }}
    >
      <Field id="pl-title" label="Title">
        {(p) => <Input {...p} name="title" defaultValue={title} required maxLength={100} />}
      </Field>
      <Field id="pl-description" label="Description">
        {(p) => (
          <Textarea {...p} name="description" rows={2} maxLength={500} defaultValue={description ?? ''} />
        )}
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="visibility" defaultChecked={visibility === 'PUBLIC'} /> Public — anyone
        with the link, and your artist page
      </label>
      <div className="flex justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await deletePlaylistAction(id);
              if (!r.ok) return void toast.error(r.error);
              router.push('/studio');
            })
          }
        >
          Delete playlist
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
