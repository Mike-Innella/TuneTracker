import { Globe, Lock } from 'lucide-react';
import { projects, requireProfile } from '@tunetracker/backend';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { ProjectTabs } from '@/components/projects/project-tabs';
import { or404 } from '@/lib/or-404';
import { formatDate } from '@/lib/format';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const me = await requireProfile();
  const { project, role } = await or404(projects.getProject(me.id, projectId));
  return (
    <div className="mx-auto max-w-[96rem]">
      <header className="mb-6 flex items-center gap-4">
        <ProjectArtwork title={project.title} url={project.artworkUrl} className="size-14 sm:size-16" />
        <div className="min-w-0">
          <h1 className="type-title text-2xl break-words sm:text-3xl" data-testid="project-title">
            {project.title}
          </h1>
          <p className="type-role mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              {project.visibility === 'PUBLIC' ? (
                <Globe className="size-3" aria-hidden />
              ) : (
                <Lock className="size-3" aria-hidden />
              )}
              {project.visibility.toLowerCase()}
            </span>
            <span>{project.status.replace('_', ' ')}</span>
            {project.dueDate && (
              <span>
                due{' '}
                <span className="type-figure normal-case">
                  {formatDate(project.dueDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </span>
            )}
            <span>your role: {role.toLowerCase()}</span>
            {project.archivedAt && <span className="text-warning">archived</span>}
          </p>
        </div>
      </header>
      <ProjectTabs projectId={projectId} />
      {children}
    </div>
  );
}
