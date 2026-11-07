import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

const LINKS = [
  ['The board', '/#board'],
  ['Community', '/#community'],
  ['About', '/about'],
  ['Sign up', '/signup'],
  ['Log in', '/login'],
] as const;

/** Liner-notes back page: who it's for on the left, the index on the right, catalogue line below. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-stock">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            A workspace for music projects. Free for producers, DJs, vocalists, songwriters, engineers and
            every other music creative.
          </p>
        </div>
        <nav aria-label="Footer" className="md:col-span-5 md:col-start-8">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5">
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-sm hover:text-electric">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap justify-between gap-2 border-t border-border py-6">
          <p className="type-role text-ink-soft">TuneTracker · Create · Collaborate · Share</p>
          <p className="type-figure text-xs text-ink-soft">TT-2.0</p>
        </div>
      </div>
    </footer>
  );
}
