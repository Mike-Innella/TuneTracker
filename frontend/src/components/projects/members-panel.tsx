'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { SectionHeading } from '@/components/layout/page-header';
import { changeRoleAction, inviteMemberAction, removeMemberAction } from '@/features/projects/actions';

type Person = { id: string; username: string; displayName: string; avatarUrl: string | null };

export function MembersPanel({
  projectId,
  meId,
  isOwner,
  owner,
  members,
}: {
  projectId: string;
  meId: string;
  isOwner: boolean;
  owner: Person;
  members: { role: 'EDITOR' | 'VIEWER'; profile: Person }[];
}) {
  const [pending, start] = useTransition();

  function invite(form: FormData) {
    const username = String(form.get('username') ?? '').replace(/^@/, '');
    const role = String(form.get('role') ?? 'VIEWER');
    start(async () => {
      const r = await inviteMemberAction(projectId, { username, role });
      if (r.ok) toast.success(`@${username} added as ${role.toLowerCase()}`);
      else toast.error(r.error);
    });
  }

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(ok);
      else toast.error(r.error ?? 'Something went wrong');
    });

  return (
    <section aria-labelledby="team">
      <SectionHeading>
        <span id="team">Credits</span>
      </SectionHeading>
      <ul className="grid gap-3" data-testid="members">
        <li className="flex items-center gap-3">
          <UserAvatar name={owner.displayName} url={owner.avatarUrl} />
          <Link
            href={`/artists/${owner.username}`}
            className="min-w-0 truncate text-sm font-medium hover:underline"
          >
            {owner.displayName}
          </Link>
          <span className="credit-leader" aria-hidden />
          <span className="type-role text-muted-foreground">Owner</span>
        </li>
        {members.map((m) => (
          <li key={m.profile.id} className="flex items-center gap-3">
            <UserAvatar name={m.profile.displayName} url={m.profile.avatarUrl} />
            <Link
              href={`/artists/${m.profile.username}`}
              className="min-w-0 truncate text-sm font-medium hover:underline"
            >
              {m.profile.displayName}
            </Link>
            <span className="credit-leader" aria-hidden />
            {isOwner ? (
              <>
                <select
                  aria-label={`Role for ${m.profile.displayName}`}
                  defaultValue={m.role}
                  disabled={pending}
                  onChange={(e) =>
                    run(() => changeRoleAction(projectId, m.profile.id, e.target.value), 'Role updated')
                  }
                  className="type-role h-9 rounded-md border border-input bg-stock px-2 dark:bg-input/30"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(() => removeMemberAction(projectId, m.profile.id), 'Collaborator removed')
                  }
                >
                  Remove
                </Button>
              </>
            ) : (
              <span className="type-role text-muted-foreground">{m.role.toLowerCase()}</span>
            )}
            {!isOwner && m.profile.id === meId && (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => run(() => removeMemberAction(projectId, meId), 'You left the project')}
              >
                Leave
              </Button>
            )}
          </li>
        ))}
      </ul>

      {isOwner && (
        <form action={invite} className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label htmlFor="invite-username" className="sr-only">
            Username to invite
          </label>
          <Input id="invite-username" name="username" placeholder="@username" required autoComplete="off" />
          <label htmlFor="invite-role" className="sr-only">
            Role
          </label>
          <select
            id="invite-role"
            name="role"
            defaultValue="EDITOR"
            className="h-10 rounded-md border border-input bg-stock px-3 text-sm dark:bg-input/30"
          >
            <option value="EDITOR">Editor</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <UserPlus aria-hidden />} Invite
          </Button>
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Editors can change the board; viewers can read and comment. Invitees must already have an account.
          </p>
        </form>
      )}
    </section>
  );
}
