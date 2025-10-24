import type { ClientType } from '@/db';
import { books, gradeBooks, grades } from '@/db/schema/index';
import { eq } from 'drizzle-orm';

export async function fetchBookBySlug(client: ClientType, slug: string) {
  const [result] = await client
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
      gradeId: grades.id,
      gradeName: grades.name,
    })
    .from(books)
    .leftJoin(gradeBooks, eq(books.id, gradeBooks.bookId))
    .leftJoin(grades, eq(gradeBooks.gradeId, grades.id))
    .where(eq(books.slug, slug))
    .limit(1);

  return result;
}

export async function fetchGradeById(client: ClientType, gradeId: string) {
  const [grade] = await client
    .select({
      id: grades.id,
      name: grades.name,
    })
    .from(grades)
    .where(eq(grades.id, gradeId));

  return {
    gradeId: grade?.id ?? null,
    gradeName: grade?.name ?? null,
  };
}

export async function attachOrUpdateGrade(client: ClientType, bookId: string, gradeId?: string) {
  if (!gradeId)
    return {
      gradeId: null,
      gradeName: null,
    };

  const existing = await client.select({ id: gradeBooks.id }).from(gradeBooks).where(eq(gradeBooks.bookId, bookId));

  if (existing.length > 0) {
    await client.update(gradeBooks).set({ gradeId, updatedAt: new Date() }).where(eq(gradeBooks.bookId, bookId));
  } else {
    await client.insert(gradeBooks).values({
      bookId,
      gradeId,
      createdBy: 'system',
      orderIndex: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return fetchGradeById(client, gradeId);
}
