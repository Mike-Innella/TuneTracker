import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About',
  description: 'Why TuneTracker exists, who it is for, and what it is not.',
};

const PRINCIPLES = [
  ['The board comes first', 'Everything else exists to move a track forward.'],
  ['Private by default', 'Publishing is always an explicit act. Nothing leaks from a project on its own.'],
  ['Built for musicians', 'Tracks, stems, mixes, tempo and key — not generic project-management jargon.'],
  ['Between sessions', 'Fast to scan on a laptop beside the DAW or on a phone in the hallway.'],
];

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <h1 className="type-title text-5xl sm:text-6xl">About TuneTracker</h1>
      <p className="mt-8 text-lg leading-relaxed">
        Music projects sprawl across voice memos, chat threads, DAW sessions and notes apps. TuneTracker gives
        music creatives one place to organise projects, run their production workflow on a Kanban board,
        collaborate with other artists, and share progress or finished work with a community that gives
        constructive feedback.
      </p>

      <h2 className="type-role mt-14 border-b border-rule pb-2 text-muted-foreground">Who it’s for</h2>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Producers, DJs, vocalists, songwriters, instrumentalists, recording artists, audio engineers — anyone
        finishing music, alone or with a small group.
      </p>

      <h2 className="type-role mt-12 border-b border-rule pb-2 text-muted-foreground">What it isn’t</h2>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        TuneTracker is not a streaming service, not a generic task manager and not a general-purpose social
        network. It’s a workspace with a community attached.
      </p>

      <h2 className="type-role mt-12 border-b border-rule pb-2 text-muted-foreground">Principles</h2>
      <dl className="mt-4 grid gap-5">
        {PRINCIPLES.map(([t, d]) => (
          <div key={t}>
            <dt className="font-semibold">{t}</dt>
            <dd className="mt-1 text-muted-foreground">{d}</dd>
          </div>
        ))}
      </dl>

      <h2 className="type-role mt-12 border-b border-rule pb-2 text-muted-foreground">
        Content and reporting
      </h2>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Only share music you have the rights to. Every post, comment and profile has a Report action for
        harassment, spam or suspected copyright infringement; reports are private and reviewed by the
        operators of this instance.
      </p>

      <div className="mt-14 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/signup">Get Started</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </article>
  );
}
