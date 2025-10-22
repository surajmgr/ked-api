import { and, asc, desc, eq, gt, lt, or, type SQL } from 'drizzle-orm';
import type { PgColumn, PgSelect } from 'drizzle-orm/pg-core';
import { ApiError } from './error';

export const withNormalPagination = <T extends PgSelect>(
  qb: T,
  orderBy: PgColumn | SQL | SQL.Aliased,
  page: number = 1,
  limit: number = 10,
) =>
  qb
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

type CursorPayload = { createdAt: string; id: string };

export const withCursorPagination = async <T extends PgSelect>(
  qb: T,
  orderBy: {
    createdAt: PgColumn;
    id: PgColumn;
    direction?: 'asc' | 'desc';
  },
  cursor?: string,
  limit: number = 10,
  state: 'prev' | 'next' = 'next',
) => {
  const backward = state === 'prev';
  let cursorObj: CursorPayload | null = null;
  if (cursor) {
    try {
      cursorObj = JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch {
      throw new ApiError('Invalid cursor', 400);
    }
  }

  const { createdAt, id, direction = 'desc' } = orderBy;

  const queryDirection = backward ? (direction === 'desc' ? 'asc' : 'desc') : direction;

  const whereCondition = cursorObj
    ? queryDirection === 'desc'
      ? or(
          lt(createdAt, new Date(cursorObj.createdAt)),
          and(eq(createdAt, new Date(cursorObj.createdAt)), lt(id, cursorObj.id)),
        )
      : or(
          gt(createdAt, new Date(cursorObj.createdAt)),
          and(eq(createdAt, new Date(cursorObj.createdAt)), gt(id, cursorObj.id)),
        )
    : undefined;

  const rows = await qb
    .where(whereCondition)
    .orderBy(
      queryDirection === 'desc' ? desc(createdAt) : asc(createdAt),
      queryDirection === 'desc' ? desc(id) : asc(id),
    )
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  let data = rows.slice(0, limit) as Awaited<T>;

  if (backward) data = data.reverse() as Awaited<T>;

  const first = data[0];
  const last = data[data.length - 1];

  const nextCursor =
    last && createdAt.name in last && id.name in last
      ? Buffer.from(
          JSON.stringify({
            createdAt: new Date(last[createdAt.name]).toISOString(),
            id: last[id.name],
          }),
        ).toString('base64')
      : undefined;

  const hasPrev = !!cursorObj;

  const prevCursor =
    first && createdAt.name in first && id.name in first
      ? Buffer.from(
          JSON.stringify({
            createdAt: new Date(first[createdAt.name]).toISOString(),
            id: first[id.name],
          }),
        ).toString('base64')
      : undefined;

  return {
    result: data,
    pagination: {
      next: {
        cursor: nextCursor,
        more: backward ? hasPrev : hasMore,
      },
      prev: {
        cursor: prevCursor,
        more: backward ? hasMore : hasPrev,
      },
    },
  };
};
