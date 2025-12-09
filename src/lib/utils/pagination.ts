import { and, asc, type ColumnDataType, desc, eq, gt, lt, or, type SQL } from 'drizzle-orm';
import type { PgColumn, PgSelect } from 'drizzle-orm/pg-core';
import z from 'zod/v3';

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

type CursorColumn = {
  column: PgColumn;
  name: string;
};

type CursorOrder = {
  main: CursorColumn;
  unique?: CursorColumn;
  direction?: 'asc' | 'desc';
};

const cursorPayloadSchema = z.object({
  main: z.string(),
  unique: z.string().nullable().optional(),
});
type CursorPayloadSchema = z.infer<typeof cursorPayloadSchema>;
type CursorPayload = {
  main: string | number | Date | boolean;
  unique?: string | number | Date | boolean;
};

function parseCursorValue(value: string | null | undefined, type?: ColumnDataType) {
  if (value == null) return undefined;

  try {
    switch (type) {
      case 'number': {
        const n = Number(value);
        if (Number.isNaN(n)) throw new Error(`Invalid number: ${value}`);
        return n;
      }
      case 'date': {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
        return d;
      }
      case 'boolean':
        return value === 'true';
      default:
        return value.toString();
    }
  } catch (_err) {
    throw new Error(`Failed to parse cursor value "${value}" as ${type}`);
  }
}

function stringifyCursorValue(value: string | number | Date) {
  if (value instanceof Date) return value.toISOString();
  return value.toString();
}

export const withCursorPagination = async <T extends PgSelect>(
  qb: T,
  orderBy: CursorOrder,
  cursor?: string,
  limit: number = 10,
  state: 'prev' | 'next' = 'next',
  baseWhere?: SQL,
) => {
  const backward = state === 'prev';
  const { main, unique, direction = 'desc' } = orderBy;

  // Decode cursor safely
  let cursorObj: CursorPayload | null = null;
  if (cursor) {
    try {
      const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString());
      const validated = cursorPayloadSchema.safeParse(parsed);
      if (validated.success) {
        const parsedMainValue = parseCursorValue(validated.data.main, main.column.dataType);
        if (parsedMainValue === undefined) throw new Error('Invalid main cursor value');
        cursorObj = {
          main: parsedMainValue,
          unique: parseCursorValue(validated.data.unique, unique?.column.dataType),
        };
      }
    } catch {
      cursorObj = null;
    }
  }

  // Determine direction for query
  const queryDirection = backward ? (direction === 'desc' ? 'asc' : 'desc') : direction;

  // Build cursor-based where condition
  let cursorCondition: SQL | undefined;
  if (cursorObj) {
    if (unique?.column && cursorObj.unique !== undefined) {
      cursorCondition =
        queryDirection === 'desc'
          ? or(
              lt(main.column, cursorObj.main),
              and(eq(main.column, cursorObj.main), lt(unique.column, cursorObj.unique)),
            )
          : or(
              gt(main.column, cursorObj.main),
              and(eq(main.column, cursorObj.main), gt(unique.column, cursorObj.unique)),
            );
    } else {
      cursorCondition = queryDirection === 'desc' ? lt(main.column, cursorObj.main) : gt(main.column, cursorObj.main);
    }
  }

  const whereCondition = baseWhere ? (cursorCondition ? and(baseWhere, cursorCondition) : baseWhere) : cursorCondition;

  const orderColumns = [
    queryDirection === 'desc' ? desc(main.column) : asc(main.column),
    ...(unique?.column ? [queryDirection === 'desc' ? desc(unique.column) : asc(unique.column)] : []),
  ];

  // Fetch rows
  const rows = await qb
    .where(whereCondition)
    .orderBy(...orderColumns)
    .limit(limit + 1);

  // Slice and reverse if backward
  const hasMore = rows.length > limit;
  let data = rows.slice(0, limit) as Awaited<T>;
  if (backward) data = data.reverse() as Awaited<T>;

  const first = data[0];
  const last = data[data.length - 1];

  // Encode cursor
  const encodeCursor = (item: Awaited<T>[0]) => {
    const payload: CursorPayloadSchema = { main: stringifyCursorValue(item[main.name]) };
    if (unique?.column) payload.unique = stringifyCursorValue(item[unique.name]);
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  };

  return {
    result: data,
    pagination: {
      next: { cursor: last ? encodeCursor(last) : undefined, more: backward ? !!cursorObj : hasMore },
      prev: { cursor: first ? encodeCursor(first) : undefined, more: backward ? hasMore : !!cursorObj },
    },
  };
};
