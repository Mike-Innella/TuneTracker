'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/animate-ui/icons/search';
import { AnimateIcon } from '@animate-ui/react/icons';

/** Plain GET form: works before hydration, results live on Discover (tracks, samples, artists). */
export function HeaderSearch() {
  const q = useSearchParams().get('q') ?? '';
  return (
    <>
      <form action="/discover" role="search" className="relative hidden w-full max-w-sm md:block">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          key={q}
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search tracks, samples, artists"
          aria-label="Search tracks, samples and artists"
          className="h-9 w-full rounded-full border border-input bg-stock-2 pr-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
      </form>
      <AnimateIcon animateOnTap asChild>
        <Link
          href="/discover#search"
          aria-label="Search"
          className="grid size-9 place-items-center rounded-full hover:bg-muted md:hidden"
        >
          <SearchIcon className="size-4" aria-hidden />
        </Link>
      </AnimateIcon>
    </>
  );
}
