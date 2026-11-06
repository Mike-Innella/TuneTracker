import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { CountingNumber } from '@animate-ui/react/primitives/texts/counting-number';
import { analytics, requireProfile } from '@tunetracker/backend';
import { PlaysChart } from '@/components/analytics/plays-chart';
import { EmptyState, PageHeader, SectionHeading } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { TabLinks } from '@/components/ui/tab-links';

export const metadata: Metadata = { title: 'Analytics' };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const me = await requireProfile();
  const { days: raw } = await searchParams;
  const days = (analytics.RANGES as readonly number[]).includes(Number(raw))
    ? (Number(raw) as analytics.Range)
    : 30;
  const o = await analytics.overview(me.id, days);
  const change =
    o.change === null
      ? 'No earlier plays to compare'
      : `${o.change >= 0 ? '+' : '−'}${Math.round(Math.abs(o.change) * 100)}% vs the previous ${days} days`;
  const figures = [
    ['Plays', o.plays],
    ['Listeners', o.listeners],
    ['Likes', o.likes],
    ['Playlist adds', o.playlistAdds],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Analytics"
        description="Real listens only: one per listener per 30 minutes, and never your own."
        actions={
          <Button asChild variant="ghost">
            <Link href="/studio">Back to Studio</Link>
          </Button>
        }
      />
      <TabLinks
        label="Range"
        className="mb-8"
        items={[7, 30, 90].map((d) => ({
          href: `/studio/analytics?days=${d}`,
          label: `${d} days`,
          active: d === days,
        }))}
      />
      <dl
        className="mb-10 grid grid-cols-2 gap-x-8 gap-y-4 border-y border-rule py-4 sm:grid-cols-4"
        data-testid="analytics-figures"
      >
        {figures.map(([k, v]) => (
          <div key={k} className="grid gap-1">
            <dt className="type-role text-muted-foreground">{k}</dt>
            <dd className="text-3xl">
              <CountingNumber number={v} inView className="type-figure tabular-nums" />
            </dd>
          </div>
        ))}
      </dl>
      {o.plays === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No listens yet in this range"
          action={
            <Button asChild>
              <Link href="/studio/upload">Upload a track</Link>
            </Button>
          }
        >
          Publish a track and share it — listens show up here as people play it.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section aria-labelledby="per-day">
            <SectionHeading>
              <span id="per-day">Plays per day</span>
            </SectionHeading>
            <p className="mb-4 text-sm text-muted-foreground">
              {change}
              {o.anonymousPlays > 0 && ` · ${o.anonymousPlays} from listeners without an account`}
            </p>
            <PlaysChart series={o.series} />
          </section>
          <section aria-labelledby="top">
            <SectionHeading>
              <span id="top">Top tracks</span>
            </SectionHeading>
            <ol className="grid gap-2" data-testid="top-tracks">
              {o.topTracks.map((t, i) => (
                <li key={t.id} className="flex items-baseline gap-3">
                  <span className="type-figure w-5 text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Link href={`/tracks/${t.id}`} className="min-w-0 truncate font-medium hover:underline">
                    {t.title}
                  </Link>
                  <span className="credit-leader" aria-hidden />
                  <span className="type-figure shrink-0 text-sm">{t.plays}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
