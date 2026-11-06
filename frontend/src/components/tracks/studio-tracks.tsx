'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicTrack } from '@tunetracker/backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteTrackAction } from '@/features/tracks/actions';
import { TrackList } from './track-list';

/** Your catalogue in Studio: every row can be edited or deleted. */
export function StudioTracks({ tracks }: { tracks: PublicTrack[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const icon =
    'grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground';
  return (
    <TrackList
      tracks={tracks}
      actions={(t) => (
        <span className="flex">
          <Link href={`/studio/tracks/${t.id}`} className={icon} aria-label={`Edit ${t.title}`}>
            <Pencil className="size-4" aria-hidden />
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className={icon} aria-label={`Delete ${t.title}`} disabled={pending}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{t.title}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  The track, its plays and likes are removed, and it leaves every playlist. Its audio file is
                  deleted unless a post still uses it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction
                  disabled={pending}
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() =>
                    start(async () => {
                      const r = await deleteTrackAction(t.id);
                      if (!r.ok) return void toast.error(r.error);
                      toast.success('Track deleted');
                      router.refresh();
                    })
                  }
                >
                  Delete track
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </span>
      )}
    />
  );
}
