'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { Camera, ExternalLink, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { SPECIALTIES } from '@tunetracker/shared';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { SectionHeading } from '@/components/layout/page-header';
import { setAvatarAction, updateProfileAction } from '@/features/profile/actions';
import { uploadFile } from '@/features/media/upload';
import { cn } from '@/lib/utils';

type Profile = {
  displayName: string;
  username: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  specialties: string[];
  isPublic: boolean;
  avatarUrl: string | null;
  socialLinks: { label: string; url: string }[];
};

const LINK_PRESETS = ['SoundCloud', 'Bandcamp', 'YouTube', 'Spotify', 'Instagram'];

export function ProfileForm({ profile }: { profile: Profile }) {
  const [pending, start] = useTransition();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>(profile.specialties);
  const [links, setLinks] = useState(
    profile.socialLinks.length ? profile.socialLinks : [{ label: 'SoundCloud', url: '' }],
  );
  const [error, setError] = useState<{ msg: string; fields?: Record<string, string[]> } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    setAvatarBusy(true);
    try {
      const asset = await uploadFile(file, { kind: 'IMAGE', visibility: 'public' });
      const r = await setAvatarAction(asset.id);
      if (!r.ok) throw new Error(r.error);
      toast.success('Profile picture updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function save(form: FormData) {
    const f = Object.fromEntries(form) as Record<string, string>;
    start(async () => {
      const r = await updateProfileAction({
        displayName: f.displayName ?? '',
        username: f.username ?? '',
        bio: f.bio,
        location: f.location,
        website: f.website,
        specialties,
        isPublic: f.isPublic === 'on',
        socialLinks: links.filter((l) => l.url.trim()),
      });
      if (r.ok) {
        setError(null);
        toast.success('Profile saved');
      } else setError({ msg: r.error, fields: r.fieldErrors });
    });
  }

  const fe = error?.fields;
  return (
    <div className="grid gap-10">
      <section aria-labelledby="avatar-h" className="flex flex-wrap items-center gap-5">
        <h2 id="avatar-h" className="sr-only">
          Profile picture
        </h2>
        <UserAvatar name={profile.displayName} url={profile.avatarUrl} className="size-24 text-lg" />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            id="avatar-input"
            aria-label="Profile photo file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => onAvatar(e.target.files?.[0])}
          />
          <Button variant="outline" disabled={avatarBusy} onClick={() => fileRef.current?.click()}>
            {avatarBusy ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}
            {profile.avatarUrl ? 'Replace picture' : 'Upload picture'}
          </Button>
          {profile.avatarUrl && (
            <Button
              variant="ghost"
              disabled={avatarBusy}
              onClick={() =>
                start(async () => {
                  const r = await setAvatarAction(null);
                  if (r.ok) toast.success('Picture removed');
                  else toast.error(r.error);
                })
              }
            >
              Remove
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href={`/artists/${profile.username}`}>
              <ExternalLink aria-hidden /> View public profile
            </Link>
          </Button>
        </div>
      </section>

      <form action={save} className="grid gap-6">
        {error && <FormMessage>{error.msg}</FormMessage>}
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="pf-name" label="Display name" error={fe?.displayName}>
            {(p) => (
              <Input {...p} name="displayName" defaultValue={profile.displayName} required maxLength={60} />
            )}
          </Field>
          <Field
            id="pf-username"
            label="Username"
            error={fe?.username}
            hint="Your profile lives at /artists/username"
          >
            {(p) => <Input {...p} name="username" defaultValue={profile.username} required maxLength={30} />}
          </Field>
        </div>
        <Field id="pf-bio" label="Biography" error={fe?.bio}>
          {(p) => (
            <Textarea
              {...p}
              name="bio"
              defaultValue={profile.bio ?? ''}
              rows={4}
              maxLength={1000}
              placeholder="What you make, who you make it with, what you’re working on."
            />
          )}
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="pf-location" label="Location" error={fe?.location}>
            {(p) => (
              <Input
                {...p}
                name="location"
                defaultValue={profile.location ?? ''}
                maxLength={80}
                placeholder="Optional"
              />
            )}
          </Field>
          <Field id="pf-website" label="Website" error={fe?.website}>
            {(p) => (
              <Input
                {...p}
                name="website"
                type="url"
                inputMode="url"
                defaultValue={profile.website ?? ''}
                placeholder="https://"
              />
            )}
          </Field>
        </div>

        <fieldset>
          <legend className="type-role mb-2 text-muted-foreground">Creative specialties</legend>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((s) => {
              const on = specialties.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setSpecialties(on ? specialties.filter((x) => x !== s) : [...specialties, s])
                  }
                  className={cn(
                    'h-9 rounded-full border px-3.5 text-sm transition-colors',
                    on
                      ? 'border-electric bg-accent text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="type-role mb-2 text-muted-foreground">Links</legend>
          {links.map((l, i) => (
            <div key={i} className="grid grid-cols-[8.5rem_minmax(0,1fr)_auto] gap-2">
              <Input
                aria-label={`Link ${i + 1} label`}
                list="link-presets"
                value={l.label}
                maxLength={30}
                onChange={(e) =>
                  setLinks(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
              />
              <Input
                aria-label={`Link ${i + 1} URL`}
                type="url"
                inputMode="url"
                placeholder="https://"
                value={l.url}
                aria-invalid={fe?.[`socialLinks.${i}.url`] ? true : undefined}
                onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove link ${i + 1}`}
                onClick={() => setLinks(links.filter((_, j) => j !== i))}
              >
                <X aria-hidden />
              </Button>
            </div>
          ))}
          <datalist id="link-presets">
            {LINK_PRESETS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          {links.length < 10 && (
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setLinks([...links, { label: LINK_PRESETS[links.length % LINK_PRESETS.length]!, url: '' }])
                }
              >
                <Plus aria-hidden /> Add link
              </Button>
            </div>
          )}
        </fieldset>

        <section aria-labelledby="privacy-h">
          <SectionHeading>
            <span id="privacy-h">Privacy</span>
          </SectionHeading>
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block font-medium">Public profile</span>
              <span className="block text-sm text-muted-foreground">
                Off: only you can see your profile page. Your community posts still show your name.
              </span>
            </span>
            <Switch name="isPublic" defaultChecked={profile.isPublic} aria-label="Public profile" />
          </label>
        </section>

        <div>
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />} Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}
