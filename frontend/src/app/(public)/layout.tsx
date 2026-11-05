import { getCurrentProfile, notifications, publicUrl } from '@tunetracker/backend';
import { AppShell } from '@/components/layout/app-shell';

/** Public pages (tracks, artists): readable and playable without an account. */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentProfile();
  const [items, unread] = me
    ? await Promise.all([notifications.listNotifications(me.id, 15), notifications.unreadCount(me.id)])
    : [[], 0];
  return (
    <AppShell
      me={
        me && {
          displayName: me.displayName,
          username: me.username,
          avatarUrl: publicUrl(me.avatarPath),
          isModerator: me.role !== 'USER',
        }
      }
      notifications={items}
      unread={unread}
    >
      {children}
    </AppShell>
  );
}
