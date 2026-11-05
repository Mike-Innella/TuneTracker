'use client';

import { useActionState, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PROJECT_TEMPLATES } from '@tunetracker/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/ui/submit-button';
import { createProjectAction } from '@/features/projects/actions';
import { cn } from '@/lib/utils';

export function CreateProjectDialog() {
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(params.get('new') === '1');
  const [template, setTemplate] = useState<keyof typeof PROJECT_TEMPLATES>('production');
  const [state, action] = useActionState(createProjectAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o && params.get('new')) router.replace('/projects');
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden /> New project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="type-title text-2xl">New project</DialogTitle>
          <DialogDescription>
            Pick a starting board. You can rename, add or reorder columns any time.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-5">
          {state && !state.ok && <FormMessage>{state.error}</FormMessage>}
          <Field id="title" label="Title" error={fe?.title}>
            {(p) => (
              <Input {...p} name="title" required maxLength={120} placeholder="Midnight Drive" autoFocus />
            )}
          </Field>
          <fieldset>
            <legend className="type-role mb-2 text-muted-foreground">Board template</legend>
            <input type="hidden" name="template" value={template} />
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
              {Object.entries(PROJECT_TEMPLATES).map(([key, t]) => {
                const active = template === key;
                return (
                  <button
                    type="button"
                    key={key}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTemplate(key as keyof typeof PROJECT_TEMPLATES)}
                    className={cn(
                      'rounded-md border px-3 py-2.5 text-left transition-colors hover:bg-muted',
                      active ? 'border-electric bg-accent' : 'border-border',
                    )}
                  >
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {t.columns.join(' → ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Field id="description" label="Description" error={fe?.description}>
            {(p) => (
              <Textarea
                {...p}
                name="description"
                maxLength={2000}
                rows={3}
                placeholder="What is this record about?"
              />
            )}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="dueDate" label="Deadline" error={fe?.dueDate}>
              {(p) => <Input {...p} name="dueDate" type="date" />}
            </Field>
            <Field id="visibility" label="Visibility" hint="Public shows title & description only">
              {(p) => (
                <select
                  {...p}
                  name="visibility"
                  defaultValue="PRIVATE"
                  className="h-10 rounded-md border border-input bg-stock px-3 text-sm dark:bg-input/30"
                >
                  <option value="PRIVATE">Private — collaborators only</option>
                  <option value="PUBLIC">Public overview</option>
                </select>
              )}
            </Field>
          </div>
          <SubmitButton size="lg" pendingLabel="Creating…">
            Create project
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
