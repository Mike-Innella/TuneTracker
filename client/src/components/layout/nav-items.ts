import { FolderKanban, LayoutDashboard, Settings, UserRound, Users } from 'lucide-react';

export const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/profile', label: 'Profile', icon: UserRound },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;
