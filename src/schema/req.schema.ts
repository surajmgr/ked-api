import { z } from '@hono/zod-openapi';

export const idParamsSchema = z.object({
  id: z.cuid2().openapi({
    param: {
      name: 'id',
      in: 'path',
    },
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3',
  }),
});

export const slugParamsSchema = z.object({
  slug: z.string().openapi({
    param: {
      name: 'slug',
      in: 'path',
    },
    example: 'slug',
  }),
});

export const getBookQuerySchema = z.object({
  gradesLimit: z.coerce
    .number()
    .min(1)
    .max(100)
    .default(3)
    .openapi({
      param: {
        name: 'gradesLimit',
        in: 'query',
      },
      example: 3,
    }),
});

export const cursorPaginationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .min(1)
    .max(100)
    .default(10)
    .openapi({
      param: {
        name: 'limit',
        in: 'query',
      },
      example: 10,
    }),
  cursor: z
    .string()
    .optional()
    .openapi({
      param: {
        name: 'cursor',
        in: 'query',
      },
      example: '1559556960',
    }),
  state: z
    .enum(['prev', 'next'])
    .default('next')
    .openapi({
      param: {
        name: 'state',
        in: 'query',
      },
      example: 'next',
    }),
  c_total: z.coerce
    .boolean()
    .default(false)
    .openapi({
      param: {
        name: 'c_total',
        in: 'query',
      },
      example: false,
    }),
});
