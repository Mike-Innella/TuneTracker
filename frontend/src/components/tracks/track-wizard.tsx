'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Music, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { GENRES, USAGE_RIGHTS, type UsageRightsKey } from '@tunetracker/shared';
import { AudioPlayer } from '@/components/audio/audio-player';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormSteps } from '@/components/ui/form-steps';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { createTrackDraftAction, publishTrackAction, updateTrackAction } from '@/features/tracks/actions';
import { uploadFile } from '@/features/media/upload';
import { cn } from '@/lib/utils';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';

export type EditableTrack = {
  id: string;
  kind: 'TRACK' | 'SAMPLE';
  status: 'DRAFT' | 'PUBLISHED';
  visibility: 'PRIVATE' | 'PUBLIC';
  title: string;
  description: string | null;
  genre: string | null;
  tags: string[];
  credits: { name: string; role: string }[];
  bpm: number | null;
  musicalKey: string | null;
  downloadable: boolean;
  usageRights: UsageRightsKey | null;
  audioUrl: string | null;
  artworkUrl: string | null;
  durationSec: number | null;
};

const STEPS = ['Upload', 'Details', 'Release'] as const;
const select =
  'h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring';

/**
 * Guided upload: 1) pick and upload the file (it becomes a private draft at once, so nothing is
 * lost if the tab closes), 2) details, 3) release settings and publish. Editing skips step 1.
 */
export function TrackWizard({ initial }: { initial?: EditableTrack }) {
  const router = useRouter();
  const [{ step, direction }, setStep] = useState({ step: initial ? 1 : 0, direction: 1 as 1 | -1 });
  const go = (to: number) => setStep({ step: to, direction: to > step ? 1 : -1 });
  const [track, setTrack] = useState<EditableTrack | null>(initial ?? null);
  const [kind, setKind] = useState<'TRACK' | 'SAMPLE'>(initial?.kind ?? 'TRACK');
  const [progress, setProgress] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const artRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setProgress(0);
    try {
      const asset = await uploadFile(file, { kind: 'AUDIO', visibility: 'private' }, setProgress);
      const draft = await createTrackDraftAction({ audioId: asset.id, kind });
      if (!draft.ok) throw new Error(draft.error);
      setTrack({
        id: draft.data.id,
        kind,
        status: 'DRAFT',
        visibility: 'PUBLIC',
        title: asset.title ?? file.name.replace(/\.[^.]+$/, ''),
        description: null,
        genre: null,
        tags: [],
        credits: [],
        bpm: null,
        musicalKey: null,
        downloadable: false,
        usageRights: null,
        audioUrl: asset.url,
        artworkUrl: null,
        durationSec: asset.durationSec,
      });
      toast.success('Uploaded — saved as a draft');
      go(1);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onArtwork(file: File | undefined) {
    if (!file || !track) return;
    try {
      const art = await uploadFile(file, { kind: 'IMAGE', visibility: 'public' });
      const r = await updateTrackAction(track.id, { artworkId: art.id });
      if (!r.ok) throw new Error(r.error);
      setTrack({ ...track, artworkUrl: art.url });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      if (artRef.current) artRef.current.value = '';
    }
  }

  function save(patch: Parameters<typeof updateTrackAction>[1], then: () => void) {
    if (!track) return;
    start(async () => {
      const r = await updateTrackAction(track.id, patch);
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.error);
        return;
      }
      setErrors({});
      then();
    });
  }

  function saveDetails(form: FormData) {
    const f = Object.fromEntries(form) as Record<string, string>;
    const credits = form
      .getAll('creditName')
      .map((n, i) => ({ name: String(n).trim(), role: String(form.getAll('creditRole')[i] ?? '').trim() }))
      .filter((c) => c.name && c.role);
    const patch = {
      title: f.title ?? '',
      description: f.description || null,
      genre: (f.genre || null) as (typeof GENRES)[number] | null,
      tags: (f.tags ?? '')
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
      bpm: f.bpm ? Number(f.bpm) : null,
      musicalKey: f.musicalKey || null,
      credits,
    };
    save(patch, () => {
      setTrack((t) => t && { ...t, ...patch });
      go(2);
    });
  }

  function release(form: FormData, publish: boolean) {
    if (!track) return;
    const downloadable = track.kind === 'SAMPLE' && form.get('downloadable') === 'on';
    const patch = {
      visibility: form.get('visibility') === 'PRIVATE' ? ('PRIVATE' as const) : ('PUBLIC' as const),
      downloadable,
      usageRights: track.kind === 'SAMPLE' ? (form.get('usageRights') as UsageRightsKey) || null : null,
    };
    save(patch, () => {
      if (!publish) {
        toast.success('Saved');
        router.push('/studio');
        return;
      }
      start(async () => {
        const r = await publishTrackAction(track.id);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success('Published');
        router.push(`/tracks/${track.id}`);
      });
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-8 flex items-center gap-2 sm:gap-3" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
            aria-current={i === step ? 'step' : undefined}
          >
            <span
              className={cn(
                'type-figure grid size-7 shrink-0 place-items-center rounded-full border text-xs',
                i === step
                  ? 'action-gradient border-transparent'
                  : i < step
                    ? 'border-foreground'
                    : 'border-border text-muted-foreground',
              )}
            >
              {i + 1}
            </span>
            <span className={cn('type-role text-sm', i !== step && 'text-muted-foreground max-sm:sr-only')}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px min-w-3 flex-1 bg-border" aria-hidden />}
          </li>
        ))}
      </ol>

      <FormSteps step={step} direction={direction}>
        {step === 0 && (
          <section className="grid gap-6" aria-labelledby="step-upload">
            <h2 id="step-upload" tabIndex={-1} className="type-title text-2xl outline-none">
              What are you uploading?
            </h2>
            <div role="radiogroup" aria-label="Upload type" className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['TRACK', 'Track', 'A song, demo or mix for people to listen to.'],
                  ['SAMPLE', 'Sample', 'A loop, one-shot or stem others may reuse, under rights you choose.'],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={kind === value}
                  onClick={() => setKind(value)}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-colors',
                    kind === value ? 'border-electric bg-muted/60' : 'border-border hover:bg-muted/40',
                  )}
                >
                  <span className="block font-semibold">{label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-dashed border-rule p-8 text-center">
              <input
                ref={fileRef}
                id="track-audio"
                type="file"
                accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/flac,.mp3,.m4a,.wav,.ogg,.flac"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <Button
                type="button"
                size="lg"
                disabled={progress !== null}
                onClick={() => fileRef.current?.click()}
              >
                {progress !== null ? <Loader2 className="animate-spin" aria-hidden /> : <Music aria-hidden />}
                {progress !== null ? `Uploading ${progress}%` : 'Choose audio file'}
              </Button>
              {progress !== null && (
                <div
                  className="mx-auto mt-4 h-1 max-w-xs overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Upload progress"
                >
                  <div
                    className="h-full"
                    style={{ width: `${progress}%`, backgroundImage: 'var(--gradient-light)' }}
                  />
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                MP3, AAC/M4A, WAV, OGG or FLAC · up to 50 MB · large files resume if the connection drops
              </p>
            </div>
          </section>
        )}

        {step === 1 && track && (
          <form action={saveDetails} className="grid gap-5" aria-labelledby="step-details">
            <h2 id="step-details" tabIndex={-1} className="type-title text-2xl outline-none">
              Details
            </h2>
            <AudioPlayer
              id={`draft:${track.id}`}
              src={track.audioUrl}
              title={track.title}
              durationSec={track.durationSec}
            />
            <div className="flex items-center gap-4">
              <ProjectArtwork title={track.title} url={track.artworkUrl} className="size-20 text-lg" />
              <input
                ref={artRef}
                id="track-artwork"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => onArtwork(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" onClick={() => artRef.current?.click()}>
                {track.artworkUrl ? 'Replace artwork' : 'Add artwork'}
              </Button>
            </div>
            <Field id="title" label="Title" error={errors.title}>
              {(p) => <Input {...p} name="title" defaultValue={track.title} required maxLength={160} />}
            </Field>
            <Field id="description" label="Liner notes" error={errors.description}>
              {(p) => (
                <Textarea
                  {...p}
                  name="description"
                  rows={4}
                  defaultValue={track.description ?? ''}
                  maxLength={5000}
                />
              )}
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="genre" label="Genre" error={errors.genre}>
                {(p) => (
                  <select {...p} name="genre" defaultValue={track.genre ?? ''} className={select}>
                    <option value="">—</option>
                    {GENRES.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field id="bpm" label="Tempo (BPM)" error={errors.bpm}>
                {(p) => (
                  <Input {...p} name="bpm" type="number" min={20} max={400} defaultValue={track.bpm ?? ''} />
                )}
              </Field>
              <Field id="musicalKey" label="Key" error={errors.musicalKey}>
                {(p) => (
                  <Input
                    {...p}
                    name="musicalKey"
                    placeholder="A minor"
                    maxLength={12}
                    defaultValue={track.musicalKey ?? ''}
                  />
                )}
              </Field>
            </div>
            <Field id="tags" label="Tags" hint="Comma separated, up to 10" error={errors.tags}>
              {(p) => <Input {...p} name="tags" defaultValue={track.tags.join(', ')} />}
            </Field>
            <Credits initial={track.credits} />
            <div className="flex justify-between gap-3">
              <span />
              <Button type="submit" disabled={pending}>
                Continue
              </Button>
            </div>
          </form>
        )}

        {step === 2 && track && (
          <form
            className="grid gap-6"
            aria-labelledby="step-release"
            onSubmit={(e) => {
              e.preventDefault();
              const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
              release(new FormData(e.currentTarget), submitter?.value === 'publish');
            }}
          >
            <h2 id="step-release" tabIndex={-1} className="type-title text-2xl outline-none">
              Release
            </h2>
            <fieldset className="grid gap-3">
              <legend className="type-role mb-1 text-muted-foreground">Who can listen</legend>
              {(
                [
                  ['PUBLIC', 'Public', 'Anyone, signed in or not, on Discover, your profile and this link.'],
                  ['PRIVATE', 'Private', 'Only you.'],
                ] as const
              ).map(([v, label, hint]) => (
                <label
                  key={v}
                  className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 has-checked:border-electric"
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={v}
                    defaultChecked={track.visibility === v}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{label}</span>
                    <span className="text-sm text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            {track.kind === 'SAMPLE' && <SampleRights track={track} error={errors.usageRights} />}
            <div className="flex flex-wrap justify-between gap-3">
              <Button type="button" variant="ghost" onClick={() => go(1)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="submit" name="intent" value="save" variant="outline" disabled={pending}>
                  Save draft
                </Button>
                <Button type="submit" name="intent" value="publish" disabled={pending}>
                  {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
                  {track.status === 'PUBLISHED' ? 'Save' : 'Publish'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </FormSteps>
    </div>
  );
}

function Credits({ initial }: { initial: { name: string; role: string }[] }) {
  const [rows, setRows] = useState(initial.length ? initial : [{ name: '', role: '' }]);
  return (
    <fieldset className="grid gap-2">
      <legend className="type-role mb-1 text-muted-foreground">Credits</legend>
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <Input
            name="creditRole"
            aria-label={`Credit ${i + 1} role`}
            placeholder="Role (e.g. Mixing)"
            defaultValue={r.role}
            maxLength={40}
          />
          <Input
            name="creditName"
            aria-label={`Credit ${i + 1} name`}
            placeholder="Name"
            defaultValue={r.name}
            maxLength={80}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove credit ${i + 1}`}
            onClick={() => setRows(rows.filter((_, j) => j !== i))}
          >
            <X aria-hidden />
          </Button>
        </div>
      ))}
      {rows.length < 20 && (
        <Button
          type="button"
          variant="ghost"
          className="justify-self-start"
          onClick={() => setRows([...rows, { name: '', role: '' }])}
        >
          <Plus aria-hidden /> Add credit
        </Button>
      )}
    </fieldset>
  );
}

function SampleRights({ track, error }: { track: EditableTrack; error?: string[] }) {
  const [downloadable, setDownloadable] = useState(track.downloadable);
  const [rights, setRights] = useState<UsageRightsKey | ''>(track.usageRights ?? '');
  return (
    <fieldset className="grid gap-4">
      <legend className="type-role mb-1 text-muted-foreground">Usage rights</legend>
      <Field
        id="usageRights"
        label="How others may use it"
        error={error ?? (downloadable && !rights ? 'Required to allow downloads' : undefined)}
      >
        {(p) => (
          <select
            {...p}
            name="usageRights"
            value={rights}
            onChange={(e) => setRights(e.target.value as UsageRightsKey)}
            className={select}
          >
            <option value="">Choose…</option>
            {Object.entries(USAGE_RIGHTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      {rights && <p className="-mt-2 text-sm text-muted-foreground">{USAGE_RIGHTS[rights].summary}</p>}
      <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
        <span>
          <span className="block font-medium">Allow downloads</span>
          <span className="text-sm text-muted-foreground">Listeners can download the original file.</span>
        </span>
        <Switch
          name="downloadable"
          checked={downloadable}
          onCheckedChange={setDownloadable}
          aria-label="Allow downloads"
        />
      </label>
    </fieldset>
  );
}
