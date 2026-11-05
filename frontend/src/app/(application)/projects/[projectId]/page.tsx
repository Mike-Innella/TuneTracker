import type { Metadata } from 'next';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { collaboration, projects, publicUrl, requireProfile } from '@tunetracker/backend';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/layout/page-header';
import { MembersPanel } from '@/components/projects/members-panel';
import { ProjectDangerZone, ProjectSettingsForm } from '@/components/projects/project-settings';
import { or404 } from '@/lib/or-404';
import { timeAgo } from '@/lib/format';

export const metadata: Metadata = { title: 'Project' };

export default async function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const me = await requireProfile();
  const { project, role, members, activity, owner } = await or404(projects.getProject(me.id, projectId));
  const canEdit = role !== 'VIEWER';
  const invites = role === 'OWNER' ? await collaboration.projectInvites(me.id, projectId) : [];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="grid content-start gap-10">
        <section aria-labelledby="details">
          <SectionHeading
            action={
              canEdit && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/community/new?projectId=${project.id}`}>
                    <Share2 aria-hidden /> Share progress
                  </Link>
                </Button>
              )
            }
          >
            <span id="details">Details</span>
          </SectionHeading>
          {canEdit ? (
            <ProjectSettingsForm
              project={{
                id: project.id,
                title: project.title,
                description: project.description,
                status: project.status,
                visibility: project.visibility,
                dueDate: project.dueDate,
                artworkUrl: project.artworkUrl,
              }}
              isOwner={role === 'OWNER'}
            />
          ) : (
            <p className="max-w-prose text-muted-foreground">
              {project.description || 'No description yet.'}
            </p>
          )}
        </section>

        {role === 'OWNER' && (
          <ProjectDangerZone projectId={project.id} archived={!!project.archivedAt} title={project.title} />
        )}
      </div>

      <div className="grid content-start gap-10">
        <MembersPanel
          projectId={project.id}
          meId={me.id}
          isOwner={role === 'OWNER'}
          invites={invites}
          owner={{ ...owner, avatarUrl: publicUrl(owner.avatarPath) }}
          members={members.map((m) => ({
            role: m.role,
            profile: { ...m.profile, avatarUrl: publicUrl(m.profile.avatarPath) },
          }))}
        />
        <section aria-labelledby="activity">
          <SectionHeading>
            <span id="activity">Activity</span>
          </SectionHeading>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="grid gap-3">
              {activity.map((a) => (
                <li key={a.id} className="text-sm">
                  <span className="font-medium">{a.actor.displayName}</span>{' '}
                  <span className="text-muted-foreground">{a.summary}</span>
                  <span className="type-figure block text-xs text-ink-soft">{timeAgo(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
