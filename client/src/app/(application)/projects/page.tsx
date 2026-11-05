import type { Metadata } from 'next';
import Link from 'next/link';
import { Pressable as PressButton } from '@/components/ui/pressable';
import { Suspense } from 'react';
import { Archive, FolderKanban, Globe, Lock, Users } from 'lucide-react';
import { projects, requireProfile } from '@tunetracker/server';
import { EmptyState, PageHeader } from '@/components/layout/page-header';
import { ProgressLine } from '@/components/dashboard/progress-line';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { formatDate } from '@/lib/format';
import { TabLinks } from '@/components/ui/tab-links';

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
      <TabLinks
        label="Project filter"
        className="mb-6"
        items={[
          { href: '/projects', label: 'Active', active: !archived },
          { href: '/projects?view=archived', label: 'Archived', active: archived },
        ]}
      />

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
              {/* card recipe: press to 0.985 (Animate UI), hover lifts 2px and deepens the shadow */}
              {/* 0.985 = Animate UI scale.choice; the token module is client-only and this is a server page */}
              <PressButton asChild tapScale={0.985}>
                <Link
                  href={`/projects/${p.id}/board`}
                  className="sheet group flex h-full flex-col p-4 transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-lift) motion-reduce:hover:translate-y-0"
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
              </PressButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
