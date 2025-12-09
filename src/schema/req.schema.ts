import { z } from '@hono/zod-openapi';

/**
 * Generic builder for OpenAPI path parameter schemas.
 *
 * @example
 * const params = buildParams({
 *   bookId: z.string().uuid(),
 *   topicId: z.cuid2(),
 *   slug: z.string().min(1),
 * });
 *
 * // produces:
 * // z.object({ bookId: ..., topicId: ..., slug: ... })
 * // each with proper .openapi({ param: { name, in: 'path' }})
 */
export function buildParams<T extends Record<string, z.ZodTypeAny>>(shape: T) {
  const entries = Object.entries(shape).map(([key, schema]) => {
    // attach openapi metadata if not already present
    const withMeta =
      'openapiMetadata' in (schema as z.ZodType)._def
        ? schema
        : schema.openapi({
            param: {
              name: key,
              in: 'path',
            },
            example: makeExampleFor(key),
          });

    return [key, withMeta];
  });

  return z.object(Object.fromEntries(entries) as { [K in keyof T]: T[K] });
}

/**
 * Provide a simple, readable example based on param name/type
 */
function makeExampleFor(param: string): string {
  if (param.toLowerCase().includes('id')) return 'a1b2c3d4e5f6g7h8i9j0k1l2';
  if (param.toLowerCase().includes('slug')) return 'example-slug';
  return 'example-value';
}

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
