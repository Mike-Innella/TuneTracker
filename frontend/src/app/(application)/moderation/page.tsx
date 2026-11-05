import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { moderation, requireProfile } from '@tunetracker/backend';
import { EmptyState, PageHeader } from '@/components/layout/page-header';
import { TabLinks } from '@/components/ui/tab-links';
import { ReportActions } from '@/components/moderation/report-actions';
import { or404 } from '@/lib/or-404';
import { timeAgo } from '@/lib/format';

export const metadata: Metadata = { title: 'Moderation', robots: { index: false } };

const TARGET_LABEL = { POST: 'Post', COMMENT: 'Comment', PROFILE: 'Profile' } as const;

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const me = await requireProfile();
  const { view } = await searchParams;
  const status = view === 'resolved' ? 'resolved' : 'open';
  const reports = await or404(moderation.listReports(me.id, status));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Moderation"
        description="Reports from the community. Decisions are recorded and the owner is notified."
      />
      <TabLinks
        label="Report status"
        className="mb-6"
        items={[
          { href: '/moderation', label: 'Open', active: status === 'open' },
          { href: '/moderation?view=resolved', label: 'Resolved', active: status === 'resolved' },
        ]}
      />
      {reports.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={status === 'open' ? 'No open reports' : 'Nothing resolved yet'}>
          {status === 'open' ? 'Reports from posts, comments and profiles land here.' : undefined}
        </EmptyState>
      ) : (
        <ul className="grid gap-4" data-testid="reports">
          {reports.map((r) => (
            <li key={r.id} className="sheet grid gap-3 p-5" data-testid="report">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="type-role text-electric">{TARGET_LABEL[r.targetType]}</span>
                {r.target ? (
                  <Link href={r.target.href} className="font-semibold hover:underline">
                    by @{r.target.owner}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">content already removed</span>
                )}
                <span className="type-figure ml-auto text-xs text-ink-soft">{timeAgo(r.createdAt)}</span>
              </div>
              {r.target && (
                <blockquote className="border-l border-rule pl-3 text-sm break-words whitespace-pre-wrap text-muted-foreground">
                  {r.target.preview}
                </blockquote>
              )}
              <p className="text-sm">
                <span className="type-role mr-2 text-muted-foreground">Reason</span>
                {r.reason} <span className="text-ink-soft">— @{r.reporter}</span>
              </p>
              {status === 'open' ? (
                <ReportActions reportId={r.id} targetType={r.targetType} targetGone={!r.target} />
              ) : (
                <p className="type-role text-muted-foreground">
                  {r.outcome?.replace('_', ' ').toLowerCase()}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
