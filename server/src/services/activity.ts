import { db } from '@tunetracker/data';

export function logActivity(projectId: string, actorId: string, summary: string) {
  return db().activity.create({ data: { projectId, actorId, summary: summary.slice(0, 300) } });
}
