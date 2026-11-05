import { notifications, publicUrl, requireProfile } from '@tunetracker/backend';
import { AppShell } from '@/components/layout/app-shell';

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const me = await requireProfile();
  const [items, unread] = await Promise.all([
    notifications.listNotifications(me.id, 15),
    notifications.unreadCount(me.id),
  ]);
  return (
    <AppShell
      me={{
        displayName: me.displayName,
        username: me.username,
        avatarUrl: publicUrl(me.avatarPath),
        isModerator: me.role !== 'USER',
      }}
      notifications={items}
      unread={unread}
    >
      {children}
    </AppShell>
  );
}
