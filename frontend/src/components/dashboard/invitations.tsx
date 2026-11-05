'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/layout/page-header';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { respondToInviteAction } from '@/features/projects/actions';

type Invite = {
  id: string;
  role: string;
  project: { id: string; title: string; artworkUrl: string | null };
  inviter: { username: string; displayName: string; avatarUrl: string | null };
};

export function Invitations({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (invites.length === 0) return null;
  const answer = (i: Invite, accept: boolean) =>
    start(async () => {
      const r = await respondToInviteAction(i.id, accept);
      if (!r.ok) return void toast.error(r.error);
      if (accept) {
        toast.success(`You joined “${i.project.title}”`);
        router.push(`/projects/${i.project.id}/board`);
      } else toast.success('Invitation declined');
    });
  return (
    <section id="invitations" aria-labelledby="invitations-h" className="mb-10 scroll-mt-24">
      <SectionHeading>
        <span id="invitations-h">Invitations</span>
      </SectionHeading>
      <ul className="grid gap-3">
        {invites.map((i) => (
          <li key={i.id} className="sheet flex flex-wrap items-center gap-4 p-4" data-testid="invitation">
            <ProjectArtwork title={i.project.title} url={i.project.artworkUrl} className="size-12" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{i.project.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserAvatar name={i.inviter.displayName} url={i.inviter.avatarUrl} className="size-5" />
                {i.inviter.displayName} invited you as {i.role.toLowerCase()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={pending} onClick={() => answer(i, true)}>
                <Check aria-hidden /> Accept
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => answer(i, false)}>
                <X aria-hidden /> Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
