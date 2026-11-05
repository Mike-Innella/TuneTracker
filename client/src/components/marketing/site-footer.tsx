import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-stock">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            A workspace for music projects. Free for producers, DJs, vocalists, songwriters, engineers and
            every other music creative.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            About
          </Link>
          <Link href="/signup" className="text-muted-foreground hover:text-foreground">
            Sign up
          </Link>
          <Link href="/#board" className="text-muted-foreground hover:text-foreground">
            Features
          </Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Log in
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
        <p className="type-role text-ink-soft">TuneTracker 2.0 · Create. Collaborate. Share.</p>
      </div>
    </footer>
  );
}
