import { KanbanIcon } from '@/components/animate-ui/icons/kanban';
import { LayoutDashboardIcon } from '@/components/animate-ui/icons/layout-dashboard';
import { UserRoundIcon } from '@/components/animate-ui/icons/user-round';
import { UploadIcon } from '@/components/animate-ui/icons/upload';
import { UsersIcon } from '@/components/animate-ui/icons/users';

// Animated Lucide icons (Animate UI): they play when their nav link is hovered or focused.
export const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/studio', label: 'Studio', icon: UploadIcon },
  { href: '/projects', label: 'Projects', icon: KanbanIcon },
  { href: '/community', label: 'Community', icon: UsersIcon },
  { href: '/profile', label: 'Profile', icon: UserRoundIcon },
] as const;
