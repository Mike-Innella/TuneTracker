import { db } from '@tunetracker/data';

export function notify(recipientId: string, type: string, message: string, href?: string) {
  return db().notification.create({
    data: { recipientId, type, message: message.slice(0, 300), href },
  });
}

export function listNotifications(actorId: string, limit = 20) {
  return db().notification.findMany({
    where: { recipientId: actorId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export function unreadCount(actorId: string) {
  return db().notification.count({ where: { recipientId: actorId, readAt: null } });
}

export function markAllRead(actorId: string) {
  return db().notification.updateMany({
    where: { recipientId: actorId, readAt: null },
    data: { readAt: new Date() },
  });
}
