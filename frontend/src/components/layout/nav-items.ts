import { KanbanIcon } from '@/components/animate-ui/icons/kanban';
import { LayoutDashboardIcon } from '@/components/animate-ui/icons/layout-dashboard';
import { SettingsIcon } from '@/components/animate-ui/icons/settings';
import { UserRoundIcon } from '@/components/animate-ui/icons/user-round';
import { UsersIcon } from '@/components/animate-ui/icons/users';

// Animated Lucide icons (Animate UI): they play when their nav link is hovered or focused.
export const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/projects', label: 'Projects', icon: KanbanIcon },
  { href: '/community', label: 'Community', icon: UsersIcon },
  { href: '/profile', label: 'Profile', icon: UserRoundIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
] as const;
