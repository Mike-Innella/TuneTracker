'use client';

import { useRef, useState, useTransition } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { SectionHeading } from '@/components/layout/page-header';
import { archiveProjectAction, deleteProjectAction, updateProjectAction } from '@/features/projects/actions';
import { uploadFile } from '@/features/media/upload';
import { toDateInput } from '@/lib/format';

const selectClass = 'h-10 w-full rounded-md border border-input bg-stock px-3 text-sm dark:bg-input/30';

type P = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  visibility: string;
  dueDate: Date | null;
  artworkUrl: string | null;
};

export function ProjectSettingsForm({ project, isOwner }: { project: P; isOwner: boolean }) {
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function save(form: FormData) {
    const f = Object.fromEntries(form) as Record<string, string>;
    start(async () => {
      const res = await updateProjectAction(project.id, {
        title: f.title,
        description: f.description,
        status: f.status as never,
        dueDate: f.dueDate as never,
        ...(isOwner ? { visibility: f.visibility as never } : {}),
      });
      if (res.ok) toast.success('Project saved');
      else toast.error(res.error);
    });
  }

  async function onArtwork(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadFile(file, { kind: 'IMAGE', visibility: 'public', projectId: project.id });
      const res = await updateProjectAction(project.id, { artworkPath: asset.path });
      if (!res.ok) throw new Error(res.error);
      toast.success('Artwork updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <form action={save} className="grid gap-5">
      {isOwner && (
        <div className="flex items-center gap-4">
          <ProjectArtwork title={project.title} url={project.artworkUrl} className="size-20" />
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              id="artwork"
              onChange={(e) => onArtwork(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
              {project.artworkUrl ? 'Replace artwork' : 'Add artwork'}
            </Button>
            <p className="mt-1.5 text-xs text-muted-foreground">PNG, JPG or WebP, up to 5 MB.</p>
          </div>
        </div>
      )}
      <Field id="p-title" label="Title">
        {(p) => <Input {...p} name="title" defaultValue={project.title} required maxLength={120} />}
      </Field>
      <Field id="p-description" label="Description">
        {(p) => (
          <Textarea
            {...p}
            name="description"
            defaultValue={project.description ?? ''}
            rows={4}
            maxLength={2000}
          />
        )}
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="p-status" label="Status">
          {(p) => (
            <select {...p} name="status" defaultValue={project.status} className={selectClass}>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          )}
        </Field>
        <Field id="p-due" label="Deadline">
          {(p) => <Input {...p} name="dueDate" type="date" defaultValue={toDateInput(project.dueDate)} />}
        </Field>
        <Field id="p-visibility" label="Visibility">
          {(p) => (
            <select
              {...p}
              name="visibility"
              defaultValue={project.visibility}
              disabled={!isOwner}
              className={selectClass}
            >
              <option value="PRIVATE">Private</option>
              <option value="PUBLIC">Public overview</option>
            </select>
          )}
        </Field>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />} Save changes
        </Button>
      </div>
    </form>
  );
}

export function ProjectDangerZone({
  projectId,
  archived,
  title,
}: {
  projectId: string;
  archived: boolean;
  title: string;
}) {
  const [pending, start] = useTransition();
  return (
    <section aria-labelledby="danger">
      <SectionHeading>
        <span id="danger">Archive or delete</span>
      </SectionHeading>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await archiveProjectAction(projectId, !archived);
              if (r.ok) toast.success(archived ? 'Project restored' : 'Project archived');
              else toast.error(r.error);
            })
          }
        >
          {archived ? 'Restore project' : 'Archive project'}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete project</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes the board, tasks, checklists and comments. Posts you shared stay in
                the community without the project link. This can’t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep project</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() =>
                  start(async () => {
                    const r = await deleteProjectAction(projectId);
                    if (r && !r.ok) toast.error(r.error);
                  })
                }
              >
                Delete forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Archiving hides the project from your active list and keeps everything.
      </p>
    </section>
  );
}
