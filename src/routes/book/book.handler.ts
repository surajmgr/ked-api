import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { HttpStatusPhrases } from '@/lib/utils/status.phrases';
import type { AppRouteHandler } from '@/lib/types/helper';
import { books } from '@/db/schema';
import { eq, count, sql, desc } from 'drizzle-orm';
import type { Active, Create, Get, List, Update } from './book.route';
import { attachOrUpdateGrade, fetchBookBySlug } from './book.helpers';
import { generateUniqueBookSlug } from '@/lib/utils/slugify';
import { getCurrentSession } from '@/lib/utils/auth';
import { ApiError } from '@/lib/utils/error';
import { cacheJSON, getCachedJSON } from '@/lib/utils/cache';
import { CACHE_DEFAULTS } from '@/lib/utils/defaults';
import type { GradeSchema } from '@/db/schema/tables/book';
import { withCursorPagination } from '@/lib/utils/pagination';

export const get: AppRouteHandler<Get> = async (c) => {
  const cachedJson = await getCachedJSON(c, CACHE_DEFAULTS.BOOK_INFO);
  if (cachedJson) return c.json(cachedJson);

  const client = await c.var.provider.db.getClient();
  const { slug } = c.req.valid('param');
  const { gradesLimit } = c.req.valid('query');

  const result = await fetchBookBySlug(client, slug, gradesLimit);

  if (!result) {
    return c.json({ success: false, message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  const responseJson = {
    success: true,
    message: HttpStatusPhrases.OK,
    data: result,
  };

  await cacheJSON(c, responseJson, CACHE_DEFAULTS.BOOK_INFO);

  return c.json(responseJson, HttpStatusCodes.OK);
};

export const list: AppRouteHandler<List> = async (c) => {
  const cachedJson = await getCachedJSON(c, CACHE_DEFAULTS.BOOK_LIST);
  if (cachedJson) return c.json(cachedJson);

  const client = await c.var.provider.db.getClient();
  const { limit, cursor, c_total, state } = c.req.valid('query');

  const whereCondition = eq(books.isActive, true);
  const booksQuery = client
    .select({
      id: books.id,
      title: books.title,
      createdAt: books.createdAt,
      slug: books.slug,
      description: books.description,
      author: books.author,
      isbn: books.isbn,
      coverImage: books.coverImage,
      category: books.category,
      difficultyLevel: books.difficultyLevel,
      isActive: books.isActive,
      createdBy: books.createdBy,
      updatedAt: books.updatedAt,
      grades: sql`(
      SELECT COALESCE(json_agg(g), '[]'::json)
      FROM (
        SELECT g.id, g.name
        FROM grade_books gb
        JOIN grades g ON gb.grade_id = g.id
        WHERE gb.book_id = books.id
        ORDER BY g.id ASC
        LIMIT 1
      ) g
      )`,
    })
    .from(books)
    .orderBy(desc(books.createdAt), desc(books.id))
    .limit(limit);

  const data = await withCursorPagination(
    booksQuery.$dynamic(),
    {
      main: {
        column: books.createdAt,
        name: 'createdAt',
      },
      unique: {
        column: books.id,
        name: 'id',
      },
    },
    cursor,
    limit,
    state,
    whereCondition,
  );

  const totalQuery = client.select({ count: count() }).from(books).where(whereCondition);
  const total = c_total ? await totalQuery.$dynamic() : null;

  const safeBooks = data.result.map((book) => {
    return {
      id: book.id,
      title: book.title,
      slug: book.slug,
      description: book.description,
      author: book.author,
      isbn: book.isbn,
      coverImage: book.coverImage,
      category: book.category,
      difficultyLevel: book.difficultyLevel,
      isActive: book.isActive,
      createdBy: book.createdBy,
      updatedAt: book.updatedAt,
      createdAt: book.createdAt,
      grades: book.grades as GradeSchema[],
    };
  });

  const responseJson = {
    success: true,
    message: 'Success',
    data: {
      ...data,
      result: safeBooks,
      pagination: { ...data.pagination, ...(total && { totalItems: total[0].count }) },
    },
  };

  await cacheJSON(c, responseJson, CACHE_DEFAULTS.BOOK_LIST);

  return c.json(responseJson, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<Create> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const body = c.req.valid('json');

  const { user } = await getCurrentSession(c, true);

  const [book] = await client
    .insert(books)
    .values({
      title: body.title,
      slug: await generateUniqueBookSlug(client, body.title),
      isActive: body.isActive ?? true,
      description: body.description,
      author: body.author,
      coverImage: body.coverImage,
      category: body.category,
      difficultyLevel: body.difficultyLevel,
      createdBy: user.id,
    })
    .returning();

  const grade = await attachOrUpdateGrade(client, book.id, body.gradeId);

  return c.json(
    { success: true, message: 'Book created successfully', data: { ...book, ...grade } },
    HttpStatusCodes.OK,
  );
};

export const update: AppRouteHandler<Update> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');

  const { user } = await getCurrentSession(c, true);

  const book = await client.query.books.findFirst({
    where: eq(books.id, id),
    columns: { createdBy: true },
  });
  if (!book) throw new ApiError('Book not found', HttpStatusCodes.NOT_FOUND);
  if (book.createdBy !== user.id) throw new ApiError('Unauthorized', HttpStatusCodes.UNAUTHORIZED);

  const { gradeId, ...rest } = body;

  const [result] = await client.update(books).set(rest).where(eq(books.id, id)).returning();
  if (!result) return c.json({ success: false, message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);

  const grade = await attachOrUpdateGrade(client, id, gradeId);

  return c.json(
    { success: true, message: 'Book updated successfully', data: { ...result, ...grade } },
    HttpStatusCodes.OK,
  );
};

// ---------- Activate/Deactivate Book ----------

export const active: AppRouteHandler<Active> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { id } = c.req.valid('param');
  const { active } = c.req.valid('json');

  const { user } = await getCurrentSession(c, true);

  const book = await client.query.books.findFirst({
    where: eq(books.id, id),
    columns: { createdBy: true },
  });
  if (!book) throw new ApiError('Book not found', HttpStatusCodes.NOT_FOUND);
  if (book.createdBy !== user.id) throw new ApiError('Unauthorized', HttpStatusCodes.UNAUTHORIZED);

  const [result] = await client.update(books).set({ isActive: active }).where(eq(books.id, id)).returning();
  if (!result) return c.json({ success: false, message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);

  return c.json(
    { success: true, message: `Book ${active ? 'activated' : 'deactivated'} successfully`, data: result },
    HttpStatusCodes.OK,
  );
};
