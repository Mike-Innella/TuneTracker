import type { Role } from '@tunetracker/shared';

export type ProjectAction =
  | 'view'
  | 'comment' // task comments, checklist toggles
  | 'edit' // board, tasks, attachments
  | 'manage'; // settings, members, visibility, delete

const MIN_ROLE: Record<ProjectAction, Role> = {
  view: 'VIEWER',
  comment: 'VIEWER',
  edit: 'EDITOR',
  manage: 'OWNER',
};
const RANK: Record<Role, number> = { VIEWER: 1, EDITOR: 2, OWNER: 3 };

/** Pure rule table — the single source of truth for project permissions. */
export function can(role: Role | null, action: ProjectAction): boolean {
  if (!role) return false;
  return RANK[role] >= RANK[MIN_ROLE[action]];
}
