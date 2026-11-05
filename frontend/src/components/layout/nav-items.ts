import { CompassIcon } from '@/components/animate-ui/icons/compass';
import { HouseIcon } from '@/components/animate-ui/icons/house';
import { KanbanIcon } from '@/components/animate-ui/icons/kanban';
import { UploadIcon } from '@/components/animate-ui/icons/upload';
import { UserRoundIcon } from '@/components/animate-ui/icons/user-round';
import { UsersIcon } from '@/components/animate-ui/icons/users';

// Animated Lucide icons (Animate UI): they play when their nav link is hovered, focused or tapped.
/** Listening — open to everyone. */
export const PRIMARY_NAV = [
  { href: '/home', label: 'Home', icon: HouseIcon },
  { href: '/discover', label: 'Discover', icon: CompassIcon },
  { href: '/community', label: 'Community', icon: UsersIcon },
] as const;

/** Making — your own work (sign-in required). */
export const STUDIO_NAV = [
  { href: '/studio', label: 'Studio', icon: UploadIcon },
  { href: '/projects', label: 'Projects', icon: KanbanIcon },
  { href: '/profile', label: 'Profile', icon: UserRoundIcon },
] as const;

/** Mobile tab bar: five thumb targets; Projects is one tap away inside Studio. */
export const MOBILE_NAV = [...PRIMARY_NAV, STUDIO_NAV[0], STUDIO_NAV[2]] as const;

export const NAV = [...PRIMARY_NAV, ...STUDIO_NAV] as const;
