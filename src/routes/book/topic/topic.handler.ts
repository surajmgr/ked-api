import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { getClient } from '@/db';
import type { AppRouteHandler } from '@/lib/types/helper';
import { books, notes, subtopics, topics } from '@/db/schema';
import { eq, count, sql, and, asc, desc } from 'drizzle-orm';
import type { Get, GetFeaturedNote, List, ListSubtopics } from './topic.route';
import { cacheJSON, getCachedJSON } from '@/lib/utils/cache';
import { CACHE_DEFAULTS } from '@/lib/utils/defaults';
import type { SelectBookTopicsSchema } from '@/db/schema/tables/topic';
import { withCursorPagination } from '@/lib/utils/pagination';
import type { SelectTopicSubtopicsSchema } from '@/db/schema/tables/subtopic';
import { getMinimalProfileById } from '@/lib/external/user';

export const list: AppRouteHandler<List> = async (c) => {
  const cachedJson = await getCachedJSON(c, CACHE_DEFAULTS.TOPIC_LIST);
  if (cachedJson) return c.json(cachedJson);

  const client = await getClient({ HYPERDRIVE: c.env.HYPERDRIVE });
  const { bookId } = c.req.valid('param');
  const { limit, cursor, c_total, state } = c.req.valid('query');

  const whereCondition = and(eq(topics.isActive, true), eq(topics.bookId, bookId));
  const topicsQuery = client
    .select({
      id: topics.id,
      title: topics.title,
      slug: topics.slug,
      orderIndex: topics.orderIndex,
      createdAt: topics.createdAt,
      _count: sql<SelectBookTopicsSchema[number]['_count']>`json_build_object(
        'subtopics', (
          SELECT COUNT(*) FROM subtopics s WHERE s.topic_id = topics.id
        ),
        'notes', (
          SELECT COUNT(*) FROM notes n WHERE n.topic_id = topics.id
        ),
        'questions', (
          SELECT COUNT(*) FROM questions q WHERE q.topic_id = topics.id
        )
      )`.as('_count'),
      subtopics: sql<SelectBookTopicsSchema[number]['subtopics']>`(
        SELECT COALESCE(
            json_agg(sub ORDER BY sub."orderIndex" ASC), '[]'::json
        )
        FROM (
            SELECT s.id, s.title, s.slug, s.order_index AS "orderIndex",
                   json_build_object(
                       'notes', (SELECT COUNT(*) FROM notes n WHERE n.subtopic_id = s.id),
                       'questions', (SELECT COUNT(*) FROM questions q WHERE q.subtopic_id = s.id)
                   ) AS _count
            FROM subtopics s
            WHERE s.topic_id = topics.id
            ORDER BY s.order_index ASC
            LIMIT 10
        ) AS sub
      )`.as('subtopics'),
    })
    .from(topics)
    .orderBy(asc(topics.orderIndex))
    .limit(limit);

  const data = await withCursorPagination(
    topicsQuery.$dynamic(),
    {
      main: {
        column: topics.orderIndex,
        name: 'orderIndex',
      },
      direction: 'asc',
    },
    cursor,
    limit,
    state,
    whereCondition,
  );

  const totalQuery = client.select({ count: count() }).from(topics).where(whereCondition);
  const total = c_total ? await totalQuery.$dynamic() : null;

  const safeTopics = data.result.map((topic) => ({
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    orderIndex: topic.orderIndex,
    _count: topic._count,
    subtopics: topic.subtopics,
  }));

  const responseJson = {
    success: true,
    message: 'Success',
    data: {
      ...data,
      result: safeTopics,
      pagination: { ...data.pagination, ...(total && { totalItems: total[0].count }) },
    },
  };

  await cacheJSON(c, responseJson, CACHE_DEFAULTS.TOPIC_LIST);
  return c.json(responseJson, HttpStatusCodes.OK);
};

export const listSubtopics: AppRouteHandler<ListSubtopics> = async (c) => {
  const cachedJson = await getCachedJSON(c, CACHE_DEFAULTS.TOPIC_LIST);
  if (cachedJson) return c.json(cachedJson);

  const client = await getClient({ HYPERDRIVE: c.env.HYPERDRIVE });
  const { id } = c.req.valid('param');
  const { limit, cursor, c_total, state } = c.req.valid('query');

  const whereCondition = and(eq(subtopics.isActive, true), eq(subtopics.topicId, id));
  const subtopicsQuery = client
    .select({
      id: subtopics.id,
      title: subtopics.title,
      description: subtopics.description,
      slug: subtopics.slug,
      orderIndex: subtopics.orderIndex,
      createdAt: subtopics.createdAt,
      _count: sql<SelectTopicSubtopicsSchema[number]['_count']>`json_build_object(
        'notes', (
          SELECT COUNT(*) FROM notes n WHERE n.subtopic_id = subtopics.id
        ),
        'questions', (
          SELECT COUNT(*) FROM questions q WHERE q.subtopic_id = subtopics.id
        )
      )`.as('_count'),
    })
    .from(subtopics)
    .orderBy(asc(subtopics.orderIndex))
    .limit(limit);

  const data = await withCursorPagination(
    subtopicsQuery.$dynamic(),
    {
      main: {
        column: subtopics.orderIndex,
        name: 'orderIndex',
      },
      direction: 'asc',
    },
    cursor,
    limit,
    state,
    whereCondition,
  );

  const totalQuery = client.select({ count: count() }).from(subtopics).where(whereCondition);
  const total = c_total ? await totalQuery.$dynamic() : null;

  const safeSubtopics = data.result.map((topic) => ({
    id: topic.id,
    title: topic.title,
    description: topic.description,
    slug: topic.slug,
    orderIndex: topic.orderIndex,
    _count: topic._count,
  }));

  const responseJson = {
    success: true,
    message: 'Success',
    data: {
      ...data,
      result: safeSubtopics,
      pagination: { ...data.pagination, ...(total && { totalItems: total[0].count }) },
    },
  };

  await cacheJSON(c, responseJson, CACHE_DEFAULTS.TOPIC_LIST);
  return c.json(responseJson, HttpStatusCodes.OK);
};

export const get: AppRouteHandler<Get> = async (c) => {
  const cachedJson = await getCachedJSON(c, CACHE_DEFAULTS.TOPIC_LIST);
  if (cachedJson) return c.json(cachedJson);

  const client = await getClient({ HYPERDRIVE: c.env.HYPERDRIVE });
  const { slug } = c.req.valid('param');

  const [topic] = await client
    .select({
      id: topics.id,
      title: topics.title,
      slug: topics.slug,
      description: topics.description,
      book: {
        id: books.id,
        title: books.title,
        slug: books.slug,
      }
    })
    .from(topics)
    .innerJoin(books, eq(books.id, topics.bookId))
    .where(eq(topics.slug, slug))
    .limit(1);

  const responseJson = {
    success: true,
    message: 'Success',
    data: topic,
  };

  await cacheJSON(c, responseJson, CACHE_DEFAULTS.TOPIC_LIST);
  return c.json(responseJson, HttpStatusCodes.OK);
}

export const getFeaturedNote: AppRouteHandler<GetFeaturedNote> = async (c) => {
  const cachedJson = await getCachedJSON(c, CACHE_DEFAULTS.TOPIC_LIST);
  if (cachedJson) return c.json(cachedJson);

  const client = await getClient({ HYPERDRIVE: c.env.HYPERDRIVE });
  const { topicId } = c.req.valid('param');

  const [note] = await client
    .select({
      id: notes.id,
      title: notes.title,
      slug: notes.slug,
      content: notes.content,
      contentType: notes.contentType,
      isPremium: notes.isPremium,
      price: notes.price,
      updatedAt: notes.updatedAt,
      ratingAvg: notes.ratingAvg,
      ratingCount: notes.ratingCount,
      downloadsCount: notes.downloadsCount,
      authorId: notes.authorId,
    })
    .from(notes)
    .where(eq(notes.topicId, topicId))
    .orderBy(desc(notes.updatedAt), desc(notes.downloadsCount), desc(notes.ratingAvg), desc(notes.ratingCount))
    .limit(1);

  const author = await getMinimalProfileById(note.authorId);

  const responseJson = {
    success: true,
    message: 'Success',
    data: {
      ...note,
      author
    }
  };

  await cacheJSON(c, responseJson, CACHE_DEFAULTS.TOPIC_LIST);
  return c.json(responseJson, HttpStatusCodes.OK)
}
