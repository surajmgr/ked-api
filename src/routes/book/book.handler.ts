import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { HttpStatusPhrases } from '@/lib/utils/status.phrases';
import { getClient } from '@/db';
import type { AppRouteHandler } from '@/lib/types/helper';
import { books, gradeBooks, grades } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { withCursorPagination } from '@/lib/utils/pagination';
import type { Active, Create, Get, List, Update } from './book.route';
import { attachOrUpdateGrade, fetchBookBySlug } from './book.helpers';
import { generateUniqueBookSlug } from '@/lib/utils/slugify';
import { getCurrentSession } from '@/lib/utils/auth';
import { ApiError } from '@/lib/utils/error';

export const get: AppRouteHandler<Get> = async (c) => {
  const client = await getClient({ HYPERDRIVE: c.env.HYPERDRIVE });
  const { slug } = c.req.valid('param');

  const result = await fetchBookBySlug(client, slug);

  if (!result) {
    return c.json({ success: false, message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
  }

  return c.json({ success: true, message: 'Success', data: result }, HttpStatusCodes.OK);
};

export const list: AppRouteHandler<List> = async (c) => {
  const client = await getClient({ HYPERDRIVE: c.env.HYPERDRIVE });
  const { limit, cursor, c_total, state } = c.req.valid('query');

  const booksQuery = client
    .selectDistinct({
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
      gradeId: grades.id,
      gradeName: grades.name,
    })
    .from(books)
    .leftJoin(gradeBooks, eq(books.id, gradeBooks.bookId))
    .leftJoin(grades, eq(gradeBooks.gradeId, grades.id))
    .where(eq(books.isActive, true))
    .orderBy(books.id)
    .limit(limit);

  const totalQuery = client.select({ count: count() }).from(books).where(eq(books.isActive, true));
  const data = await withCursorPagination(
    booksQuery.$dynamic(),
    { createdAt: books.createdAt, id: books.id, direction: 'desc' },
    cursor,
    limit,
    state,
  );
  const total = c_total ? await totalQuery.$dynamic() : null;

  return c.json(
    {
      success: true,
      message: 'Success',
      data: {
        ...data,
        pagination: { ...data.pagination, ...(total && { totalItems: total[0].count }) },
      },
    },
    HttpStatusCodes.OK,
  );
};

export const create: AppRouteHandler<Create> = async (c) => {
  const client = await getClient({ HYPERDRIVE: c.env.HYPERDRIVE });
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
  const client = await getClient({ HYPERDRIVE: c.env.HYPERDRIVE });
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
  const client = await getClient({ HYPERDRIVE: c.env.HYPERDRIVE });
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
