import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Flame, Heart, Lock, MessageSquareQuote, Pause, ThumbsUp } from 'lucide-react';
import { PROJECT_TEMPLATES } from '@tunetracker/shared';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/brand/logo';
import { DemoBoard } from '@/components/marketing/demo-board';
import { Reveal } from '@/components/marketing/reveal';

export const metadata: Metadata = {
  title: { absolute: 'TuneTracker 2.0 — A workspace for music projects' },
  alternates: { canonical: '/' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TuneTracker',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description:
    'Kanban boards for music projects, collaboration with roles, and a community feed for sharing demos and finished tracks.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

// Decorative waveform for the example post (synthetic; not a real recording).
const BARS = Array.from(
  { length: 64 },
  (_, i) => 18 + Math.round(Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.17)) * 70),
);

function Credit({ role, children }: { role: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="type-role shrink-0 text-muted-foreground">{role}</dt>
      <span className="credit-leader" aria-hidden />
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}

export default function HomePage() {
  const templates = Object.values(PROJECT_TEMPLATES).filter((t) => t.name !== 'Blank board');
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* Hero — the record's sleeve: title left, its tracklist (the board) right */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-14 pb-16 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:pt-20 lg:pb-24">
          <div className="lg:col-span-5">
            <h1 className="type-title text-[clamp(2.4rem,11vw,4.25rem)] lg:text-[clamp(2.75rem,4.4vw,4.75rem)]">
              TuneTracker <span className="text-electric not-italic">2.0</span>
            </h1>
            <p className="type-role mt-5 text-base tracking-[0.2em] text-foreground">
              Create · Collaborate · Share
            </p>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Plan every song on a board shaped like your workflow, bring collaborators in with real roles,
              and share demos for feedback when you’re ready.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get Started <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#board">Learn More</Link>
              </Button>
            </div>
            <p className="type-role mt-6 text-ink-soft">Free for music creatives</p>
          </div>
          <div className="relative lg:col-span-7">
            <div className="neon-bloom -top-28 -left-20 size-[30rem]" aria-hidden />
            <DemoBoard />
          </div>
        </div>
        <div className="border-y border-rule bg-stock/60">
          <dl className="mx-auto grid max-w-7xl gap-x-12 gap-y-3 px-5 py-6 sm:px-8 md:grid-cols-3">
            <Credit role="Produced by">You</Credit>
            <Credit role="Mixed with">Your collaborators</Credit>
            <Credit role="Shared with">The community</Credit>
          </dl>
        </div>
      </section>

      {/* The board — claim, then the real templates as proof */}
      <section id="board" className="scroll-mt-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="type-title text-4xl sm:text-5xl">A board shaped like your session.</h2>
            <p className="mt-5 max-w-md text-muted-foreground">
              Start from a music-production template, then rename, add, reorder or remove columns until the
              board matches how you actually finish a track. Drag tasks with a mouse, a finger or the keyboard
              — the order you leave is the order you come back to.
            </p>
          </div>
          <ol
            className="divide-y divide-border border-y border-rule lg:col-span-7"
            aria-label="Board templates"
          >
            {templates.map((t, i) => (
              <Reveal
                as="li"
                key={t.name}
                index={i}
                className="grid gap-1 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6"
              >
                <span className="font-semibold">{t.name}</span>
                <span className="type-role flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.74rem] text-foreground/80">
                  {t.columns.map((c, j) => (
                    <span key={c} className="inline-flex items-center gap-2">
                      {j > 0 && <ArrowRight className="size-3 text-ink-soft" aria-hidden />}
                      {c}
                    </span>
                  ))}
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Task detail — the session sheet */}
      <section className="border-y border-border bg-stock">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-12 [&>*]:min-w-0">
          <div className="sheet order-2 p-6 lg:order-1 lg:col-span-6" aria-label="Example task">
            <p className="type-title text-3xl">Lead vocal chain</p>
            <p className="type-role mt-2 text-muted-foreground">Example task · Mixing</p>
            <dl className="mt-6 grid gap-2.5 text-sm">
              <Credit role="Priority">
                <span className="text-warning">High</span>
              </Credit>
              <Credit role="Tempo · key">
                <span className="type-figure">124 BPM · F#m</span>
              </Credit>
              <Credit role="Due">
                <span className="type-figure">Fri 14</span>
              </Credit>
              <Credit role="Assigned to">Your vocalist</Credit>
              <Credit role="Checklist">
                <span className="type-figure">2/3</span>
              </Credit>
              <Credit role="Attachments">
                <span className="type-figure">vox_comp_v3.wav · ref_mix.mp3</span>
              </Credit>
            </dl>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-5 lg:col-start-8">
            <h2 className="type-title text-4xl sm:text-5xl">Every task keeps the session details.</h2>
            <p className="mt-5 text-muted-foreground">
              Priorities, due dates, labels, checklists, comments and assignees — plus the things music needs:
              tempo, key, stems and reference mixes you can play right inside the task.
            </p>
          </div>
        </div>
      </section>

      {/* Collaboration — credit everyone */}
      <section id="collaborate" className="scroll-mt-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="type-title text-4xl sm:text-5xl">Credit everyone who touches the record.</h2>
            <p className="mt-5 max-w-md text-muted-foreground">
              Invite other artists by username and give each one a role. Permissions are checked on the server
              for every change, so a viewer link can never edit your board.
            </p>
          </div>
          <div className="lg:col-span-7">
            <dl className="grid gap-5 border-y border-rule py-6">
              <Credit role="Owner">Everything, including members, visibility and deletion</Credit>
              <Credit role="Editor">Columns, tasks, files, comments</Credit>
              <Credit role="Viewer">Reads the board and joins the discussion</Credit>
            </dl>
            <p className="mt-6 flex items-start gap-3 text-sm text-muted-foreground">
              <Lock className="mt-0.5 size-4 shrink-0 text-electric" aria-hidden />
              Projects are private by default. Making one public shows only its title, description and artwork
              — never tasks, files or collaborators.
            </p>
          </div>
        </div>
      </section>

      {/* Community — an example post sleeve */}
      <section
        id="community"
        className="relative scroll-mt-20 overflow-hidden border-y border-border bg-stock"
      >
        <div className="neon-bloom -right-32 bottom-0 size-[32rem]" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="type-title text-4xl sm:text-5xl">Share a demo. Ask for notes.</h2>
            <p className="mt-5 max-w-md text-muted-foreground">
              Post progress updates, samples, demos and finished tracks with the audio attached. Other artists
              listen, react and leave feedback. Uploads go straight from your browser to storage — up to
              50&nbsp;MB per track.
            </p>
            <Button asChild variant="outline" className="mt-8">
              <Link href="/signup">Join the community</Link>
            </Button>
          </div>
          <figure
            className="sheet overflow-hidden lg:col-span-6 lg:col-start-7"
            aria-label="Example community post"
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5">
              <div className="min-w-0">
                <p className="type-title text-2xl">“Echoes” — first full mix</p>
                <figcaption className="type-role mt-1.5 text-muted-foreground">
                  Example post · Synthwave
                </figcaption>
              </div>
              <span className="type-role inline-flex shrink-0 items-center gap-1 rounded-full border border-electric/50 px-2.5 py-1 text-electric">
                <MessageSquareQuote className="size-3" aria-hidden /> Feedback
              </span>
            </div>
            <div
              className="mx-5 mt-4 flex items-center gap-4 rounded-md border border-border bg-stock-2 p-3"
              aria-hidden
            >
              <span className="action-gradient grid size-10 shrink-0 place-items-center rounded-full">
                <Pause className="size-4" />
              </span>
              <svg viewBox="0 0 256 40" className="h-10 flex-1" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="wave" x1="0" x2="1">
                    <stop offset="0" stopColor="#2ee6ff" />
                    <stop offset="0.5" stopColor="#3a6bff" />
                    <stop offset="1" stopColor="#b34dff" />
                  </linearGradient>
                </defs>
                {BARS.map((h, i) => (
                  <rect
                    key={i}
                    x={i * 4}
                    y={20 - (h * 18) / 100}
                    width="2.4"
                    height={(h * 36) / 100}
                    rx="1.2"
                    fill={i < 26 ? 'url(#wave)' : 'currentColor'}
                    className={i < 26 ? undefined : 'text-rule'}
                  />
                ))}
              </svg>
              <span className="type-figure text-xs text-muted-foreground">1:24 / 3:32</span>
            </div>
            <p className="px-5 pt-4 text-[0.95rem] text-muted-foreground">
              Finally bounced the full arrangement. Does the second drop hit hard enough, or should the pad
              come down?
            </p>
            <div
              className="mt-4 flex gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground"
              aria-hidden
            >
              {[ThumbsUp, Flame, Heart].map((Icon, i) => (
                <span
                  key={i}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3"
                >
                  <Icon className="size-3.5" />
                </span>
              ))}
            </div>
          </figure>
        </div>
      </section>

      {/* How it works — the sequence carries meaning, so it's numbered */}
      <section aria-labelledby="how" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <h2 id="how" className="type-title max-w-xl text-4xl sm:text-5xl">
          From first idea to release.
        </h2>
        <ol className="mt-12 border-y border-rule">
          {[
            [
              'Start a project',
              'Pick a template — songwriting, production, mixing, release — and the board is ready.',
            ],
            [
              'Bring in your people',
              'Invite collaborators as editors or viewers and assign the tasks that are theirs.',
            ],
            [
              'Share when it’s ready',
              'Publish a demo or the finished track to the community and ask for feedback.',
            ],
          ].map(([title, body], i) => (
            <li
              key={title}
              className="grid gap-x-6 gap-y-1 border-b border-border py-5 last:border-0 sm:grid-cols-[3rem_16rem_minmax(0,1fr)] sm:items-baseline"
            >
              <span className="type-figure text-sm text-electric">A{i + 1}</span>
              <span className="text-lg font-semibold">{title}</span>
              <span className="text-muted-foreground">{body}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Close — the back cover: title and action left, the credits right */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="neon-bloom top-10 -left-32 size-[28rem]" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <LogoMark size={64} className="drop-shadow-[0_0_28px_rgb(58_107_255/0.5)]" />
            <h2 className="type-title mt-8 text-4xl sm:text-6xl">Your next record starts on a board.</h2>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get Started <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/login">I have an account</Link>
              </Button>
            </div>
          </div>
          <dl className="grid gap-4 border-y border-rule py-6 lg:col-span-5 lg:col-start-8">
            <Credit role="Board">Kanban for every song</Credit>
            <Credit role="Collaboration">Owner · editor · viewer</Credit>
            <Credit role="Community">Demos, finished tracks, feedback</Credit>
            <Credit role="Price">Free for music creatives</Credit>
          </dl>
        </div>
      </section>
    </>
  );
}
