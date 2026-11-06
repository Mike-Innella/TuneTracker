'use client';

import { useRef, useState, useTransition } from 'react';
import { ImagePlus, Loader2, Music, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PostInput } from '@tunetracker/shared';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AudioPlayer } from '@/components/audio/audio-player';
import { createPostAction, updatePostAction } from '@/features/community/actions';
import { uploadFile, type UploadedAsset } from '@/features/media/upload';
import { POST_TYPE_LABEL } from './post-card';

const selectClass = 'h-10 w-full rounded-md border border-input bg-stock px-3 text-sm dark:bg-input/30';

type Initial = {
  id: string;
  title: string;
  body: string;
  type: string;
  genre: string | null;
  tags: string[];
  links: string[];
  feedbackRequested: boolean;
  projectId: string | null;
  audio: { id: string; url: string | null; title: string | null; durationSec: number | null } | null;
  image: { id: string; url: string | null } | null;
  trackId?: string | null;
};

export function PostComposer({
  projects,
  tracks = [],
  defaultProjectId,
  initial,
}: {
  projects: { id: string; title: string; visibility: string }[];
  /** your published tracks, embeddable in the post */
  tracks?: { id: string; title: string }[];
  defaultProjectId?: string;
  initial?: Initial;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<{ msg: string; fields?: Record<string, string[]> } | null>(null);
  const [audio, setAudio] = useState<Pick<UploadedAsset, 'id' | 'url' | 'title' | 'durationSec'> | null>(
    initial?.audio ?? null,
  );
  const [image, setImage] = useState<{ id: string; url: string | null } | null>(initial?.image ?? null);
  const [progress, setProgress] = useState<{ kind: string; pct: number } | null>(null);
  const [projectId, setProjectId] = useState(initial?.projectId ?? defaultProjectId ?? '');
  const [trackId, setTrackId] = useState(initial?.trackId ?? '');
  const audioRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const linked = projects.find((p) => p.id === projectId);

  async function upload(file: File | undefined, kind: 'AUDIO' | 'IMAGE') {
    if (!file) return;
    setProgress({ kind, pct: 0 });
    try {
      const asset = await uploadFile(
        file,
        { kind, visibility: kind === 'IMAGE' ? 'public' : 'private' },
        (pct) => setProgress({ kind, pct }),
      );
      if (kind === 'AUDIO') setAudio(asset);
      else setImage(asset);
      toast.success(`${kind === 'AUDIO' ? 'Audio' : 'Image'} uploaded`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setProgress(null);
      if (audioRef.current) audioRef.current.value = '';
      if (imageRef.current) imageRef.current.value = '';
    }
  }

  function submit(form: FormData) {
    const f = Object.fromEntries(form) as Record<string, string>;
    const input: PostInput = {
      title: f.title ?? '',
      body: f.body ?? '',
      type: f.type as PostInput['type'],
      genre: f.genre,
      tags: (f.tags ?? '')
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
      links: (f.links ?? '')
        .split(/\s+/)
        .map((l) => l.trim())
        .filter(Boolean),
      feedbackRequested: f.feedbackRequested === 'on',
      projectId: projectId || null,
      audioId: audio?.id ?? null,
      imageId: image?.id ?? null,
      // posts with their own audio keep the track they were migrated to while that audio is unchanged
      trackId: audio
        ? audio.id === initial?.audio?.id
          ? (initial?.trackId ?? null)
          : null
        : trackId || null,
    };
    start(async () => {
      const r = initial ? await updatePostAction(initial.id, input) : await createPostAction(input);
      if (r && !r.ok) setError({ msg: r.error, fields: r.fieldErrors });
    });
  }

  const fe = error?.fields;
  return (
    <form action={submit} className="grid gap-6">
      {error && <FormMessage>{error.msg}</FormMessage>}
      <Field id="post-title" label="Title" error={fe?.title}>
        {(p) => (
          <Input
            {...p}
            name="title"
            required
            maxLength={160}
            defaultValue={initial?.title}
            placeholder="New track progress"
          />
        )}
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="post-type" label="What are you sharing?">
          {(p) => (
            <select {...p} name="type" defaultValue={initial?.type ?? 'PROGRESS'} className={selectClass}>
              {Object.entries(POST_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id="post-genre" label="Genre" error={fe?.genre}>
          {(p) => (
            <Input
              {...p}
              name="genre"
              maxLength={40}
              defaultValue={initial?.genre ?? ''}
              placeholder="Synthwave"
            />
          )}
        </Field>
      </div>

      <fieldset className="grid gap-3">
        <legend className="type-role mb-1 text-muted-foreground">Audio</legend>
        {audio ? (
          <div className="flex items-center gap-2">
            <AudioPlayer
              src={audio.url}
              title={audio.title ?? 'Your track'}
              durationSec={audio.durationSec}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove audio from post"
              onClick={() => setAudio(null)}
            >
              <X aria-hidden />
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-rule p-5 text-center">
            <input
              ref={audioRef}
              id="post-audio"
              aria-label="Audio file"
              type="file"
              accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/flac,.mp3,.m4a,.wav,.ogg,.flac"
              className="sr-only"
              onChange={(e) => upload(e.target.files?.[0], 'AUDIO')}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!!progress}
              onClick={() => audioRef.current?.click()}
            >
              {progress?.kind === 'AUDIO' ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Music aria-hidden />
              )}
              {progress?.kind === 'AUDIO' ? `Uploading ${progress.pct}%` : 'Upload audio'}
            </Button>
            {progress?.kind === 'AUDIO' && (
              <div
                className="mx-auto mt-3 h-1 max-w-xs overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={progress.pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Upload progress"
              >
                <div
                  className="h-full"
                  style={{ width: `${progress.pct}%`, backgroundImage: 'var(--gradient-light)' }}
                />
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">MP3, AAC/M4A, WAV, OGG or FLAC · up to 50 MB</p>
          </div>
        )}
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="type-role mb-1 text-muted-foreground">Cover image</legend>
        <input
          ref={imageRef}
          id="post-image"
          aria-label="Cover image file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => upload(e.target.files?.[0], 'IMAGE')}
        />
        {image?.url ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- user media */}
            <img src={image.url} alt="" className="size-20 rounded-md border border-border object-cover" />
            <Button type="button" variant="ghost" size="sm" onClick={() => setImage(null)}>
              Remove image
            </Button>
          </div>
        ) : (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!!progress}
              onClick={() => imageRef.current?.click()}
            >
              {progress?.kind === 'IMAGE' ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <ImagePlus aria-hidden />
              )}
              {progress?.kind === 'IMAGE' ? `Uploading ${progress.pct}%` : 'Add an image'}
            </Button>
          </div>
        )}
      </fieldset>

      <Field id="post-body" label="Notes" error={fe?.body}>
        {(p) => (
          <Textarea
            {...p}
            name="body"
            required
            rows={6}
            maxLength={10000}
            defaultValue={initial?.body}
            placeholder="What changed since the last version? What do you want ears on?"
          />
        )}
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="post-tags" label="Tags" hint="Comma separated" error={fe?.tags}>
          {(p) => (
            <Input
              {...p}
              name="tags"
              defaultValue={initial?.tags.join(', ')}
              placeholder="wip, 124bpm, analog"
            />
          )}
        </Field>
        <Field
          id="post-links"
          label="Links"
          hint="SoundCloud, Bandcamp, YouTube… separated by spaces"
          error={fe?.links ?? fe?.['links.0']}
        >
          {(p) => (
            <Input
              {...p}
              name="links"
              defaultValue={initial?.links.join(' ')}
              placeholder="https://soundcloud.com/…"
              inputMode="url"
            />
          )}
        </Field>
      </div>

      {tracks.length > 0 && !audio && (
        <Field
          id="post-track"
          label="Embed one of your tracks"
          hint="Optional. Listens from the post count toward the track."
        >
          {(p) => (
            <select
              {...p}
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              className={selectClass}
            >
              <option value="">None</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}

      <Field
        id="post-project"
        label="Related project"
        hint="Optional. Only the project’s title is shown, and only if the project is public."
      >
        {(p) => (
          <select
            {...p}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className={selectClass}
          >
            <option value="">None</option>
            {projects.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.title} {pr.visibility === 'PRIVATE' ? '(private — not shown)' : ''}
              </option>
            ))}
          </select>
        )}
      </Field>
      {linked && (
        <p className="-mt-3 text-sm text-muted-foreground">
          Tasks, files and collaborators from “{linked.title}” are never published. Only what you write and
          upload here is public.
        </p>
      )}

      <label className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3">
        <span>
          <span className="block font-medium">Ask for feedback</span>
          <span className="block text-sm text-muted-foreground">
            Highlights your post so other artists know you want notes.
          </span>
        </span>
        <Switch name="feedbackRequested" defaultChecked={initial?.feedbackRequested} />
      </label>

      <div>
        <Button type="submit" size="lg" disabled={pending || !!progress}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {initial ? 'Save post' : 'Publish post'}
        </Button>
      </div>
    </form>
  );
}
