import { HttpStatusCodes } from '@/lib/utils/status.codes';
import type { AppRouteHandler } from '@/lib/types/helper';
import { getClient } from '@/db';
import type { Create, Get, List, Remove, Update } from './example.route';
import { example } from '@/db/schema';
import { HttpStatusPhrases } from '@/lib/utils/status.phrases';
import { count, eq } from 'drizzle-orm';
import { withCursorPagination } from '@/lib/utils/pagination';

export const get: AppRouteHandler<Get> = async (c) => {
  const { HYPERDRIVE } = c.env;
  const client = await getClient({ HYPERDRIVE });

  const { id } = c.req.valid('param');

  const result = await client.query.example.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });

  if (!result) {
    return c.json(
      {
        success: false,
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(
    {
      success: true,
      message: 'Success',
      data: result,
    },
    HttpStatusCodes.OK,
  );
};

export const list: AppRouteHandler<List> = async (c) => {
  const { HYPERDRIVE } = c.env;
  const client = await getClient({ HYPERDRIVE });

  const { limit, cursor, c_total, state } = c.req.valid('query');

  const examplesQuery = client.select().from(example).limit(limit);

  const examplesTotalQuery = client.select({ count: count() }).from(example);

  const data = await withCursorPagination(
    examplesQuery.$dynamic(),
    {
      createdAt: example.createdAt,
      id: example.id,
      direction: 'desc',
    },
    cursor,
    limit,
    state,
  );

  const total = c_total ? await examplesTotalQuery.$dynamic() : null;

  return c.json(
    {
      success: true,
      message: 'Success',
      data: {
        ...data,
        pagination: {
          ...data.pagination,
          ...(total && { totalItems: total[0].count }),
        },
      },
    },
    HttpStatusCodes.OK,
  );
};

export const create: AppRouteHandler<Create> = async (c) => {
  const { HYPERDRIVE } = c.env;
  const client = await getClient({ HYPERDRIVE });

  const body = c.req.valid('json');

  const [result] = await client.insert(example).values(body).returning();

  return c.json(
    {
      success: true,
      message: 'Success',
      data: result,
    },
    HttpStatusCodes.OK,
  );
};

export const update: AppRouteHandler<Update> = async (c) => {
  const { HYPERDRIVE } = c.env;
  const client = await getClient({ HYPERDRIVE });

  const { id } = c.req.valid('param');
  const body = c.req.valid('json');

  const [result] = await client.update(example).set(body).where(eq(example.id, id)).returning();

  if (!result) {
    return c.json(
      {
        success: false,
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(
    {
      success: true,
      message: 'Success',
      data: result,
    },
    HttpStatusCodes.OK,
  );
};

export const remove: AppRouteHandler<Remove> = async (c) => {
  const { HYPERDRIVE } = c.env;
  const client = await getClient({ HYPERDRIVE });

  const { id } = c.req.valid('param');

  const result = await client.delete(example).where(eq(example.id, id));

  if (result.count === 0) {
    return c.json(
      {
        success: false,
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(
    {
      success: true,
      message: 'Success',
    },
    HttpStatusCodes.OK,
  );
};
