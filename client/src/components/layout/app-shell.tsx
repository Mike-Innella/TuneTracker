'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Plus } from 'lucide-react';
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
import { NAV } from './nav-items';
import { NotificationsMenu, type NotificationItem } from './notifications-menu';
import { ThemeToggle } from './theme-toggle';

type Me = { displayName: string; username: string; avatarUrl: string | null };

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

export function AppShell({
  me,
  notifications,
  unread,
  children,
}: {
  me: Me;
  notifications: NotificationItem[];
  unread: number;
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
          <Logo href="/dashboard" size={30} />
        </div>
        <nav aria-label="Main" className="mt-10 grid gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  active && 'bg-accent text-foreground',
                )}
              >
                <Icon className={cn('size-4', active && 'text-electric')} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <Button asChild className="mt-8">
          <Link href="/projects?new=1">
            <Plus aria-hidden /> New project
          </Link>
        </Button>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
          <AccountMenu me={me} />
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Top bar: mobile brand + global actions */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:h-16 lg:px-8">
          <div className="lg:hidden">
            <Logo href="/dashboard" size={28} version={false} compact />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <NotificationsMenu items={notifications} unread={unread} />
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
            <div className="lg:hidden">
              <AccountMenu me={me} compact />
            </div>
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        data-testid="mobile-nav"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-16 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium text-muted-foreground',
                active && 'text-foreground',
              )}
            >
              <Icon className={cn('size-5', active && 'text-electric')} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
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
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full" data-testid="logout">
              <LogOut aria-hidden /> Log out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
