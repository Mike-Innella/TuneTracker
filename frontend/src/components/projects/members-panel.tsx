'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { SectionHeading } from '@/components/layout/page-header';
import {
  changeRoleAction,
  inviteMemberAction,
  removeMemberAction,
  revokeInviteAction,
} from '@/features/projects/actions';

type Person = { id: string; username: string; displayName: string; avatarUrl: string | null };

export function MembersPanel({
  projectId,
  meId,
  isOwner,
  owner,
  members,
  invites = [],
}: {
  projectId: string;
  meId: string;
  isOwner: boolean;
  owner: Person;
  members: { role: 'EDITOR' | 'VIEWER'; profile: Person }[];
  invites?: {
    id: string;
    role: string;
    email: string | null;
    invitee: { username: string; displayName: string } | null;
  }[];
}) {
  const [pending, start] = useTransition();

  function invite(form: FormData) {
    const target = String(form.get('target') ?? '').trim();
    const role = String(form.get('role') ?? 'VIEWER');
    start(async () => {
      const r = await inviteMemberAction(projectId, { target, role });
      if (!r.ok) return void toast.error(r.error);
      toast.success(
        r.data.status === 'emailed'
          ? `Invitation emailed to ${target}`
          : `Invitation sent to ${target.startsWith('@') ? target : `@${target}`}`,
      );
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

      {isOwner && invites.length > 0 && (
        <ul className="mt-4 grid gap-2" aria-label="Pending invitations" data-testid="pending-invites">
          {invites.map((i) => (
            <li key={i.id} className="flex items-center gap-3 text-sm">
              <span className="min-w-0 truncate text-muted-foreground">
                {i.invitee ? `@${i.invitee.username}` : i.email}
              </span>
              <span className="credit-leader" aria-hidden />
              <span className="type-role text-ink-soft">pending · {i.role.toLowerCase()}</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => run(() => revokeInviteAction(projectId, i.id), 'Invitation withdrawn')}
              >
                Withdraw
              </Button>
            </li>
          ))}
        </ul>
      )}

      {isOwner && (
        <form action={invite} className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label htmlFor="invite-target" className="sr-only">
            Username or email to invite
          </label>
          <Input
            id="invite-target"
            name="target"
            placeholder="@username or email"
            required
            autoComplete="off"
          />
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
            Editors can change the board; viewers can read and comment. Invitees join once they accept; people
            without an account get an email to sign up.
          </p>
        </form>
      )}
    </section>
  );
}
