'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimateIcon } from '@animate-ui/react/icons';
import { LogOutIcon } from '@/components/animate-ui/icons/log-out';
import { PlusIcon } from '@/components/animate-ui/icons/plus';
import { NavHighlight, NavHighlightItem } from '@/components/ui/nav-highlight';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/ui/user-avatar';
import { signOut } from '@/features/auth/actions';
import { cn } from '@/lib/utils';
import { MOBILE_NAV, NAV, PRIMARY_NAV, STUDIO_NAV } from './nav-items';
import { HeaderSearch } from './header-search';
import { NotificationsMenu, type NotificationItem } from './notifications-menu';
import { ThemeToggle } from './theme-toggle';

type Me = { displayName: string; username: string; avatarUrl: string | null; isModerator: boolean };

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

export function AppShell({
  me,
  notifications,
  unread,
  children,
}: {
  /** null for signed-out visitors on public pages (tracks, artists) */
  me: Me | null;
  notifications?: NotificationItem[];
  unread?: number;
  children: React.ReactNode;
}) {
  const path = usePathname();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-stock px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo href="/home" size={30} />
        </div>
        <nav aria-label="Main" className="mt-10">
          <NavHighlight
            value={NAV.find((n) => isActive(path, n.href))?.href ?? null}
            className="inset-0 rounded-md bg-accent"
          >
            {[
              { title: 'Listen', items: PRIMARY_NAV },
              { title: 'Make', items: STUDIO_NAV },
            ].map((group) => (
              <div key={group.title} className="mb-6">
                <p className="type-role mb-2 px-3 text-ink-soft">{group.title}</p>
                <ul className="grid gap-1">
                  {group.items.map(({ href, label, icon: Icon }) => {
                    const active = isActive(path, href);
                    return (
                      <NavHighlightItem key={href} value={href}>
                        <li>
                          <AnimateIcon animateOnHover asChild>
                            <Link
                              href={href}
                              aria-current={active ? 'page' : undefined}
                              className={cn(
                                'relative z-10 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                                active && 'text-foreground',
                              )}
                            >
                              <Icon className={cn('size-4', active && 'text-electric')} aria-hidden />
                              {label}
                            </Link>
                          </AnimateIcon>
                        </li>
                      </NavHighlightItem>
                    );
                  })}
                </ul>
              </div>
            ))}
          </NavHighlight>
        </nav>
        {me && (
          <AnimateIcon animateOnHover asChild>
            <Button asChild className="mt-8">
              <Link href="/studio/upload">
                <PlusIcon aria-hidden /> Upload
              </Link>
            </Button>
          </AnimateIcon>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
          {me ? <AccountMenu me={me} /> : <GuestActions />}
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Top bar: mobile brand + global actions */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:h-16 lg:px-8">
          <div className="lg:hidden">
            <Logo href="/home" size={28} version={false} compact />
          </div>
          <Suspense fallback={<div className="flex-1" />}>
            <HeaderSearch />
          </Suspense>
          <div className="ml-auto flex items-center gap-1">
            {me && <NotificationsMenu items={notifications ?? []} unread={unread ?? 0} />}
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
            <div className="lg:hidden">{me ? <AccountMenu me={me} compact /> : <GuestActions compact />}</div>
          </div>
        </header>

        <main
          id="main"
          className="min-w-0 flex-1 px-4 pt-6 pb-[calc(var(--bottom-nav-h)+var(--player-h)+2rem)] sm:px-6 lg:px-8 lg:pt-8"
        >
          {children}
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        data-testid="mobile-nav"
        data-bottom-nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <NavHighlight
          value={MOBILE_NAV.find((n) => isActive(path, n.href))?.href ?? null}
          className="inset-x-3 top-1.5 h-1 rounded-full bg-electric"
        >
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <NavHighlightItem key={href} value={href}>
                <AnimateIcon animateOnTap asChild>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative z-10 flex h-16 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium text-muted-foreground',
                      active && 'text-foreground',
                    )}
                  >
                    <Icon className={cn('size-5', active && 'text-electric')} aria-hidden />
                    {label}
                  </Link>
                </AnimateIcon>
              </NavHighlightItem>
            );
          })}
        </NavHighlight>
      </nav>
    </div>
  );
}

/** Signed-out visitors. The compact (mobile header) form keeps only Log in so the bar fits 320px. */
function GuestActions({ compact }: { compact?: boolean }) {
  const path = usePathname();
  return (
    <div className="flex items-center gap-1.5">
      <Button asChild variant={compact ? 'outline' : 'ghost'} size="sm">
        <Link href={`/login?next=${encodeURIComponent(path)}`}>Log in</Link>
      </Button>
      {!compact && (
        <Button asChild size="sm">
          <Link href="/signup">Sign up</Link>
        </Button>
      )}
    </div>
  );
}

function AccountMenu({ me, compact }: { me: Me; compact?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex min-w-0 items-center gap-2.5 rounded-md p-1 text-left hover:bg-muted"
          aria-label="Account menu"
          data-testid="account-menu"
        >
          <UserAvatar name={me.displayName} url={me.avatarUrl} />
          {!compact && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{me.displayName}</span>
              <span className="block truncate text-xs text-muted-foreground">@{me.username}</span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">{me.displayName}</span>
          <span className="block text-xs text-muted-foreground">@{me.username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/artists/${me.username}`}>View public profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">Edit profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        {me.isModerator && (
          <DropdownMenuItem asChild>
            <Link href="/moderation">Moderation</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full" data-testid="logout">
              <LogOutIcon animateOnHover aria-hidden /> Log out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
