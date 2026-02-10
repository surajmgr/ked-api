import type { AppRouteHandler } from '@/lib/types/helper';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { ApiError } from '@/lib/utils/error';
import { getCurrentSession } from '@/lib/utils/auth';
import { notifications } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import type { List, MarkAllRead, MarkRead } from './notifications.route';
import { withCursorPagination } from '@/lib/utils/pagination';

export const list: AppRouteHandler<List> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);
  const { limit, cursor, state, unreadOnly } = c.req.valid('query');

  const baseWhere = unreadOnly
    ? and(eq(notifications.userId, user.id), eq(notifications.isRead, false))
    : eq(notifications.userId, user.id);

  const qb = client
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      referenceId: notifications.referenceId,
      referenceType: notifications.referenceType,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications);

  const data = await withCursorPagination(
    qb.$dynamic(),
    {
      main: { column: notifications.createdAt, name: 'createdAt' },
      unique: { column: notifications.id, name: 'id' },
      direction: 'desc',
    },
    cursor,
    limit,
    state,
    baseWhere,
  );

  return c.json(
    {
      success: true,
      message: 'Success',
      data,
    },
    HttpStatusCodes.OK,
  );
};

export const markRead: AppRouteHandler<MarkRead> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);
  const { id } = c.req.valid('param');

  const existing = await client.query.notifications.findFirst({
    where: and(eq(notifications.id, id), eq(notifications.userId, user.id)),
    columns: { id: true },
  });

  if (!existing) {
    throw new ApiError('Notification not found', HttpStatusCodes.NOT_FOUND);
  }

  await client
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));

  return c.json({ success: true, message: 'Marked as read' }, HttpStatusCodes.OK);
};

export const markAllRead: AppRouteHandler<MarkAllRead> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);

  await client.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id));

  return c.json({ success: true, message: 'All marked as read' }, HttpStatusCodes.OK);
};
