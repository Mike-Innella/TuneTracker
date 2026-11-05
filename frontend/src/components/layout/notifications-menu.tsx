'use client';

import Link from 'next/link';
import { AnimateIcon } from '@animate-ui/react/icons';
import { SlidingNumber } from '@animate-ui/react/primitives/texts/sliding-number';
import { BellIcon } from '@/components/animate-ui/icons/bell';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { markNotificationsRead } from '@/features/notifications/actions';
import { timeAgo } from '@/lib/format';

export type NotificationItem = {
  id: string;
  message: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationsMenu({ items, unread }: { items: NotificationItem[]; unread: number }) {
  const [, start] = useTransition();
  return (
    <Popover onOpenChange={(open) => open && unread > 0 && start(() => void markNotificationsRead())}>
      <AnimateIcon animateOnHover asChild>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          >
            <BellIcon aria-hidden />
            {unread > 0 && (
              <span className="type-figure absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] text-primary-foreground">
                {unread > 9 ? '9+' : <SlidingNumber number={unread} className="inline-block align-bottom" />}
              </span>
            )}
          </Button>
        </PopoverTrigger>
      </AnimateIcon>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="type-role border-b border-border px-4 py-3 text-muted-foreground">Notifications</p>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Nothing yet. Invites, assignments and feedback show up here.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id} className="border-b border-border last:border-0">
                <Link href={n.href ?? '#'} className="block px-4 py-3 text-sm hover:bg-muted">
                  <span className={n.readAt ? 'text-muted-foreground' : ''}>{n.message}</span>
                  <span className="type-figure mt-1 block text-xs text-ink-soft">{timeAgo(n.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
