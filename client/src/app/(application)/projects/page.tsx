import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Archive, FolderKanban, Globe, Lock, Users } from 'lucide-react';
import { projects, requireProfile } from '@tunetracker/server';
import { EmptyState, PageHeader } from '@/components/layout/page-header';
import { ProgressLine } from '@/components/dashboard/progress-line';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Projects' };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const me = await requireProfile();
  const { view } = await searchParams;
  const archived = view === 'archived';
  const list = await projects.listProjects(me.id, { archived });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Projects"
        description="Every song and release you’re working on, with its board."
        actions={
          <Suspense>
            <CreateProjectDialog />
          </Suspense>
        }
      />
      <nav aria-label="Project filter" className="mb-6 flex gap-1 border-b border-border">
        {[
          ['Active', '/projects', !archived],
          ['Archived', '/projects?view=archived', archived],
        ].map(([label, href, active]) => (
          <Link
            key={String(label)}
            href={String(href)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
              active
                ? 'border-electric text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <EmptyState
          icon={archived ? Archive : FolderKanban}
          title={archived ? 'Nothing archived' : 'Your first project starts here'}
        >
          {archived
            ? 'Archived projects keep their boards and history, out of the way.'
            : 'Create a project from a template and its board is ready to use.'}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="project-list">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}/board`}
                className="sheet group flex h-full flex-col p-4 transition-shadow hover:shadow-(--shadow-lift)"
              >
                <div className="flex items-start gap-3">
                  <ProjectArtwork title={p.title} url={p.artworkUrl} className="size-14" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold group-hover:text-electric">{p.title}</p>
                    <p className="type-role mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                      {p.visibility === 'PUBLIC' ? (
                        <Globe className="size-3" aria-label="Public" />
                      ) : (
                        <Lock className="size-3" aria-label="Private" />
                      )}
                      {p.status.replace('_', ' ')}
                      {p.role !== 'OWNER' && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3" aria-hidden /> shared with you
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {p.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                )}
                <div className="mt-auto pt-4">
                  <div className="type-figure mb-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>{p.taskCount} tasks</span>
                    <span>{p.dueDate ? `due ${formatDate(p.dueDate)}` : `${p.progress}%`}</span>
                  </div>
                  <ProgressLine value={p.progress} label={`${p.title} progress`} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
