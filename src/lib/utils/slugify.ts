import { books, questions, topics, subtopics } from '@/db/schema/index';
import type { DrizzleClient } from '@/db';
import { eq, like, sql } from 'drizzle-orm';

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
    .slice(0, 50);
}

function dateCode(dt = null) {
  const d = dt ? new Date(dt) : new Date();

  const yy = d.getUTCFullYear() % 100; // last two digits of year
  const mm = (d.getUTCMonth() + 1) % 10; // last digit of month
  const dd = String(d.getUTCDate()).padStart(2, '0'); // two-digit day

  return `${yy.toString().padStart(2, '0')}${mm}${dd}`;
}

function lexNext(s: string): string {
  const n = parseInt(s, 10);
  const next = (n + 1).toString();
  return next > s ? next : `${s}0`;
}

function randomWordGenerator(length: number) {
  const dictionary = 'abcdefghijklmnopqrstuvwxyz';
  const randomWord = Array.from({ length }, () =>
    dictionary.charAt(Math.floor(Math.random() * dictionary.length)),
  ).join('');
  return randomWord;
}

/**
 * Generates a unique slug
 * @param title The title of the book.
 * @param lastRecord A function that returns the last record with a given prefix slug.
 * @param checkExisting A function that checks if a given slug already exists.
 * @returns The unique slug for the book.
 */
export async function generateUniqueInternal(
  title: string,
  lastRecord: (prefix: string) => Promise<{ slug: string }[]>,
  checkExisting: (uniqueSlug: string) => Promise<{ slug: string }[]>,
) {
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = randomWordGenerator(10);

  const escapedBase = baseSlug.replace(/[%_]/g, '\\$&');
  const prefix = `${escapedBase}%`;

  const [last] = await lastRecord(prefix);

  if (!last) return baseSlug;

  if (last.slug === baseSlug) return `${baseSlug}-${dateCode()}`;

  const regex = new RegExp(`^${baseSlug}-(\\d+)$`);
  const match = last.slug.match(regex);

  if (match) {
    const next = lexNext(match[1]);
    return `${baseSlug}-${next}`;
  }

  let attempt = 0;
  let uniqueSlug = `${baseSlug}-${dateCode()}-${Math.floor(Math.random() * 1000)}`;
  const maxRetries = 5;

  while (attempt < maxRetries) {
    const [existing] = await checkExisting(uniqueSlug);

    if (!existing) return uniqueSlug;

    uniqueSlug = `${baseSlug}-${dateCode()}-${Math.floor(Math.random() * 1000)}`;
    attempt++;
  }

  return `${baseSlug}-${dateCode()}-${Math.floor(Math.random() * 100000)}`;
}

export async function generateUniqueBookSlug(client: DrizzleClient, title: string) {
  return generateUniqueInternal(
    title,
    async (prefix) =>
      await client
        .select({ slug: books.slug })
        .from(books)
        .where(like(books.slug, prefix))
        .orderBy(sql`slug DESC`)
        .limit(1),
    async (uniqueSlug) => await client.select({ slug: books.slug }).from(books).where(eq(books.slug, uniqueSlug)),
  );
}

export async function generateUniqueTopicSlug(client: DrizzleClient, title: string) {
  return generateUniqueInternal(
    title,
    async (prefix) =>
      await client
        .select({ slug: topics.slug })
        .from(topics)
        .where(like(topics.slug, prefix))
        .orderBy(sql`slug DESC`)
        .limit(1),
    async (uniqueSlug) => await client.select({ slug: topics.slug }).from(topics).where(eq(topics.slug, uniqueSlug)),
  );
}

export async function generateUniqueSubtopicSlug(client: DrizzleClient, title: string) {
  return generateUniqueInternal(
    title,
    async (prefix) =>
      await client
        .select({ slug: subtopics.slug })
        .from(subtopics)
        .where(like(subtopics.slug, prefix))
        .orderBy(sql`slug DESC`)
        .limit(1),
    async (uniqueSlug) =>
      await client.select({ slug: subtopics.slug }).from(subtopics).where(eq(subtopics.slug, uniqueSlug)),
  );
}

export async function generateUniqueQuestionSlug(client: DrizzleClient, title: string) {
  return generateUniqueInternal(
    title,
    async (prefix) =>
      await client
        .select({ slug: questions.slug })
        .from(questions)
        .where(like(questions.slug, prefix))
        .orderBy(sql`slug DESC`)
        .limit(1),
    async (uniqueSlug) =>
      await client.select({ slug: questions.slug }).from(questions).where(eq(questions.slug, uniqueSlug)),
  );
}
