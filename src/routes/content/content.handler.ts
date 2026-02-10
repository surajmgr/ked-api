import type { AppRouteHandler } from '@/lib/types/helper';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import {
  books,
  entitlements,
  gradeBooks,
  grades,
  noteCollaborators,
  notePurchases,
  notes,
  subtopics,
  topics,
} from '@/db/schema';
import { and, count, eq, gt, ilike, isNull, or, sql } from 'drizzle-orm';
import { getCurrentSession } from '@/lib/utils/auth';
import { ApiError } from '@/lib/utils/error';
import { generateUniqueBookSlug, generateUniqueTopicSlug, generateUniqueSubtopicSlug } from '@/lib/utils/slugify';
import type { DrizzleClient } from '@/db';
import type {
  CreateBook,
  CreateTopic,
  CreateSubtopic,
  SaveNoteDraft,
  PublishContent,
  GetContributionDashboard,
  ListBooks,
  ListTopics,
  ListSubtopics,
  ListNotesByTopicSlug,
  ListNotesBySubtopicSlug,
  CreateBulkTopics,
  CreateBulkSubtopics,
  CreateNote,
  GetNote,
  GetNoteBySlug,
  GetNotePreview,
  DeleteNote,
  GetSimilarContent,
} from './content.route';
import type { ModerationService } from '@/lib/services/moderation.service';
import { invalidateContributionCache } from '@/middleware/contribution';
import { getMinimalProfileById } from '@/lib/external/user';
import { cacheJSON, getCachedJSON } from '@/lib/utils/cache';
import { CACHE_DEFAULTS } from '@/lib/utils/defaults';
import { withCursorPagination } from '@/lib/utils/pagination';

// Helper to determine content status based on user trust
async function determineContentStatus(
  isTrusted: boolean,
  moderationService: ModerationService,
  contentId: string,
  contentType: 'book' | 'topic' | 'subtopic' | 'note',
  authorId: string,
): Promise<'PUBLISHED' | 'PENDING_REVIEW'> {
  if (isTrusted) {
    return 'PUBLISHED';
  }

  // Create review task for untrusted users
  await moderationService.createReviewTask({
    contentId,
    contentType,
    authorId,
  });

  return 'PENDING_REVIEW';
}

async function resolveBookId(client: DrizzleClient, input: { bookId?: string; bookSlug?: string }) {
  if (input.bookId) return input.bookId;
  if (input.bookSlug) {
    const book = await client.query.books.findFirst({ where: eq(books.slug, input.bookSlug), columns: { id: true } });
    if (!book) throw new ApiError('Book not found', HttpStatusCodes.NOT_FOUND);
    return book.id;
  }
  throw new ApiError('bookId or bookSlug is required', HttpStatusCodes.UNPROCESSABLE_ENTITY);
}

async function resolveTopicId(client: DrizzleClient, input: { topicId?: string; topicSlug?: string }) {
  if (input.topicId) return input.topicId;
  if (input.topicSlug) {
    const topic = await client.query.topics.findFirst({
      where: eq(topics.slug, input.topicSlug),
      columns: { id: true },
    });
    if (!topic) throw new ApiError('Topic not found', HttpStatusCodes.NOT_FOUND);
    return topic.id;
  }
  throw new ApiError('topicId or topicSlug is required', HttpStatusCodes.UNPROCESSABLE_ENTITY);
}

async function resolveSubtopicId(client: DrizzleClient, input: { subtopicId?: string; subtopicSlug?: string }) {
  if (input.subtopicId) return input.subtopicId;
  if (input.subtopicSlug) {
    const subtopic = await client.query.subtopics.findFirst({
      where: eq(subtopics.slug, input.subtopicSlug),
      columns: { id: true },
    });
    if (!subtopic) throw new ApiError('Subtopic not found', HttpStatusCodes.NOT_FOUND);
    return subtopic.id;
  }
  return undefined;
}

function isAdminRole(role?: string | null) {
  return role === 'admin' || role === 'superadmin';
}

async function canAccessPrivateNote(client: DrizzleClient, noteId: string, userId: string) {
  const collaborator = await client.query.noteCollaborators.findFirst({
    where: and(
      eq(noteCollaborators.noteId, noteId),
      eq(noteCollaborators.userId, userId),
      isNull(noteCollaborators.removedAt),
    ),
    columns: { id: true },
  });
  return !!collaborator;
}

async function isNoteUnlocked(client: DrizzleClient, note: typeof notes.$inferSelect, userId?: string) {
  if (!userId) return false;
  if (note.authorId === userId) return true;

  const now = new Date();
  const entitlement = await client.query.entitlements.findFirst({
    where: and(
      eq(entitlements.userId, userId),
      eq(entitlements.resourceType, 'NOTE'),
      eq(entitlements.resourceId, note.id),
      or(isNull(entitlements.expiresAt), gt(entitlements.expiresAt, now)),
    ),
    columns: { id: true },
  });
  if (entitlement) return true;

  // Legacy note purchase support (v1)
  const purchase = await client.query.notePurchases.findFirst({
    where: and(eq(notePurchases.noteId, note.id), eq(notePurchases.buyerId, userId)),
    columns: { id: true },
  });
  return !!purchase;
}

export const listBooks: AppRouteHandler<ListBooks> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { page, limit, search, difficulty, category } = c.req.valid('query');

  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '10', 10);
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = [];

  whereConditions.push(eq(books.status, 'PUBLISHED'));
  whereConditions.push(eq(books.isActive, true));

  if (search) {
    whereConditions.push(or(ilike(books.title, `%${search}%`), ilike(books.description, `%${search}%`)));
  }

  if (difficulty) {
    whereConditions.push(eq(books.difficultyLevel, difficulty));
  }

  if (category) {
    whereConditions.push(eq(books.category, category));
  }

  const [total] = await client
    .select({ count: count() })
    .from(books)
    .where(and(...whereConditions));

  const result = await client
    .select({
      id: books.id,
      title: books.title,
      slug: books.slug,
      description: books.description,
      coverImage: books.coverImage,
      author: books.author,
      difficultyLevel: books.difficultyLevel,
      category: books.category,
      createdAt: books.createdAt,
    })
    .from(books)
    .where(and(...whereConditions))
    .limit(limitNum)
    .offset(offset);

  return c.json(
    {
      success: true,
      message: 'Books fetched successfully',
      data: {
        pagination: {
          next: {
            more: offset + limitNum < total.count,
            cursor: (pageNum + 1).toString(),
          },
          prev: {
            more: pageNum > 1,
            cursor: (pageNum - 1).toString(),
          },
          totalItems: total.count,
        },
        result,
      },
    },
    HttpStatusCodes.OK,
  );
};

export const listTopics: AppRouteHandler<ListTopics> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { page, limit, bookId, bookSlug } = c.req.valid('query');

  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '10', 10);
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = [];

  whereConditions.push(eq(topics.status, 'PUBLISHED'));
  whereConditions.push(eq(topics.isActive, true));

  if (bookId) {
    whereConditions.push(eq(topics.bookId, bookId));
  } else if (bookSlug) {
    const book = await client.query.books.findFirst({
      where: eq(books.slug, bookSlug),
      columns: { id: true },
    });
    if (book) {
      whereConditions.push(eq(topics.bookId, book.id));
    } else {
      // If book slug provided but not found, return empty
      return c.json(
        {
          success: true,
          message: 'Book not found',
          data: {
            pagination: { next: { more: false }, prev: { more: false }, totalItems: 0 },
            result: [],
          },
        },
        HttpStatusCodes.OK,
      );
    }
  }

  const [total] = await client
    .select({ count: count() })
    .from(topics)
    .where(and(...whereConditions));

  const result = await client
    .select({
      id: topics.id,
      title: topics.title,
      slug: topics.slug,
      description: topics.description,
      orderIndex: topics.orderIndex,
      createdAt: topics.createdAt,
    })
    .from(topics)
    .where(and(...whereConditions))
    .limit(limitNum)
    .offset(offset)
    .orderBy(topics.orderIndex);

  return c.json(
    {
      success: true,
      message: 'Topics fetched successfully',
      data: {
        pagination: {
          next: {
            more: offset + limitNum < total.count,
            cursor: (pageNum + 1).toString(),
          },
          prev: {
            more: pageNum > 1,
            cursor: (pageNum - 1).toString(),
          },
          totalItems: total.count,
        },
        result,
      },
    },
    HttpStatusCodes.OK,
  );
};

export const listSubtopics: AppRouteHandler<ListSubtopics> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { page, limit, topicId, topicSlug } = c.req.valid('query');

  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '10', 10);
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = [];

  whereConditions.push(eq(subtopics.status, 'PUBLISHED'));
  whereConditions.push(eq(subtopics.isActive, true));

  if (topicId) {
    whereConditions.push(eq(subtopics.topicId, topicId));
  } else if (topicSlug) {
    const topic = await client.query.topics.findFirst({
      where: eq(topics.slug, topicSlug),
      columns: { id: true },
    });
    if (topic) {
      whereConditions.push(eq(subtopics.topicId, topic.id));
    } else {
      return c.json(
        {
          success: true,
          message: 'Subtopics not found',
          data: {
            pagination: { next: { more: false }, prev: { more: false }, totalItems: 0 },
            result: [],
          },
        },
        HttpStatusCodes.OK,
      );
    }
  }

  const [total] = await client
    .select({ count: count() })
    .from(subtopics)
    .where(and(...whereConditions));

  const result = await client
    .select({
      id: subtopics.id,
      title: subtopics.title,
      slug: subtopics.slug,
      description: subtopics.description,
      orderIndex: subtopics.orderIndex,
      createdAt: subtopics.createdAt,
    })
    .from(subtopics)
    .where(and(...whereConditions))
    .limit(limitNum)
    .offset(offset)
    .orderBy(subtopics.orderIndex);

  return c.json(
    {
      success: true,
      message: 'Subtopics fetched successfully',
      data: {
        pagination: {
          next: {
            more: offset + limitNum < total.count,
            cursor: (pageNum + 1).toString(),
          },
          prev: {
            more: pageNum > 1,
            cursor: (pageNum - 1).toString(),
          },
          totalItems: total.count,
        },
        result,
      },
    },
    HttpStatusCodes.OK,
  );
};

export const listNotesByTopicSlug: AppRouteHandler<ListNotesByTopicSlug> = async (c) => {
  const cachedJson = await getCachedJSON(c, CACHE_DEFAULTS.NOTES);
  if (cachedJson) return c.json(cachedJson);

  const client = await c.var.provider.db.getClient();
  const { topicSlug } = c.req.valid('param');
  const { limit, cursor, c_total, state } = c.req.valid('query');

  const topic = await client.query.topics.findFirst({
    where: eq(topics.slug, topicSlug),
    columns: { id: true },
  });

  if (!topic) {
    const responseJson = {
      success: true,
      message: 'Success',
      data: {
        result: [],
        pagination: { next: { more: false }, prev: { more: false }, ...(c_total ? { totalItems: 0 } : {}) },
      },
    };
    await cacheJSON(c, responseJson, CACHE_DEFAULTS.NOTES);
    return c.json(responseJson, HttpStatusCodes.OK);
  }

  const baseWhere = and(
    eq(notes.topicId, topic.id),
    eq(notes.status, 'PUBLISHED'),
    eq(notes.visibility, 'PUBLIC'),
    eq(notes.isPublic, true),
    isNull(notes.deletedAt),
  );

  const notesQuery = client
    .select({
      id: notes.id,
      slug: notes.slug,
      title: notes.title,
      summary: notes.summary,
      authorId: notes.authorId,
      topicId: notes.topicId,
      subtopicId: notes.subtopicId,
      isPremium: notes.isPremium,
      price: notes.price,
      priceCents: notes.priceCents,
      currency: notes.currency,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .limit(limit);

  const data = await withCursorPagination(
    notesQuery.$dynamic(),
    {
      main: { column: notes.updatedAt, name: 'updatedAt' },
      unique: { column: notes.id, name: 'id' },
      direction: 'desc',
    },
    cursor,
    limit,
    state,
    baseWhere,
  );

  const totalQuery = client.select({ count: count() }).from(notes).where(baseWhere);
  const total = c_total ? await totalQuery.$dynamic() : null;

  const responseJson = {
    success: true,
    message: 'Success',
    data: {
      ...data,
      pagination: { ...data.pagination, ...(total && { totalItems: total[0].count }) },
    },
  };

  await cacheJSON(c, responseJson, CACHE_DEFAULTS.NOTES);
  return c.json(responseJson, HttpStatusCodes.OK);
};

export const listNotesBySubtopicSlug: AppRouteHandler<ListNotesBySubtopicSlug> = async (c) => {
  const cachedJson = await getCachedJSON(c, CACHE_DEFAULTS.NOTES);
  if (cachedJson) return c.json(cachedJson);

  const client = await c.var.provider.db.getClient();
  const { subtopicSlug } = c.req.valid('param');
  const { limit, cursor, c_total, state } = c.req.valid('query');

  const subtopic = await client.query.subtopics.findFirst({
    where: eq(subtopics.slug, subtopicSlug),
    columns: { id: true },
  });

  if (!subtopic) {
    const responseJson = {
      success: true,
      message: 'Success',
      data: {
        result: [],
        pagination: { next: { more: false }, prev: { more: false }, ...(c_total ? { totalItems: 0 } : {}) },
      },
    };
    await cacheJSON(c, responseJson, CACHE_DEFAULTS.NOTES);
    return c.json(responseJson, HttpStatusCodes.OK);
  }

  const baseWhere = and(
    eq(notes.subtopicId, subtopic.id),
    eq(notes.status, 'PUBLISHED'),
    eq(notes.visibility, 'PUBLIC'),
    eq(notes.isPublic, true),
    isNull(notes.deletedAt),
  );

  const notesQuery = client
    .select({
      id: notes.id,
      slug: notes.slug,
      title: notes.title,
      summary: notes.summary,
      authorId: notes.authorId,
      topicId: notes.topicId,
      subtopicId: notes.subtopicId,
      isPremium: notes.isPremium,
      price: notes.price,
      priceCents: notes.priceCents,
      currency: notes.currency,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .limit(limit);

  const data = await withCursorPagination(
    notesQuery.$dynamic(),
    {
      main: { column: notes.updatedAt, name: 'updatedAt' },
      unique: { column: notes.id, name: 'id' },
      direction: 'desc',
    },
    cursor,
    limit,
    state,
    baseWhere,
  );

  const totalQuery = client.select({ count: count() }).from(notes).where(baseWhere);
  const total = c_total ? await totalQuery.$dynamic() : null;

  const responseJson = {
    success: true,
    message: 'Success',
    data: {
      ...data,
      pagination: { ...data.pagination, ...(total && { totalItems: total[0].count }) },
    },
  };

  await cacheJSON(c, responseJson, CACHE_DEFAULTS.NOTES);
  return c.json(responseJson, HttpStatusCodes.OK);
};

export const createBook: AppRouteHandler<CreateBook> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const body = c.req.valid('json');
  const { user } = await getCurrentSession(c, true);

  // Get contribution data from middleware
  const contribution = c.var.contribution;
  const gamificationService = c.var.gamificationService;
  const moderationService = c.var.moderationService;

  if (!contribution || !gamificationService || !moderationService) {
    throw new ApiError('Contribution system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Create book with DRAFT status initially
  const [book] = await client
    .insert(books)
    .values({
      title: body.title,
      slug: await generateUniqueBookSlug(client, body.title),
      description: body.description,
      author: body.author,
      isbn: body.isbn,
      coverImage: body.coverImage,
      category: body.category,
      difficultyLevel: body.difficultyLevel,
      status: 'DRAFT',
      createdBy: user.id,
    })
    .returning();

  // Determine final status based on trust
  const finalStatus = await determineContentStatus(contribution.isTrusted, moderationService, book.id, 'book', user.id);

  // Update book status
  await client.update(books).set({ status: finalStatus }).where(eq(books.id, book.id));

  // Award CP/XP if published immediately
  if (finalStatus === 'PUBLISHED') {
    const result = await gamificationService.awardPoints({
      userId: user.id,
      action: 'CREATE_BOOK',
      referenceId: book.id,
      referenceType: 'book',
    });

    const contributionData = {
      cpEarned: result.cpDelta,
      xpEarned: result.xpDelta,
      newTotal: {
        cp: result.newCP,
        xp: result.newXP,
      },
    };

    // Invalidate cache
    const cache = c.var.provider.cache;
    if (cache) {
      await invalidateContributionCache(cache, user.id);
    }

    // Indexing
    const typesenseService = c.var.typesenseService;
    if (typesenseService) {
      // Fetch grade names from gradeBooks junction table
      const gradeData = await client
        .select({
          gradeName: sql`${client.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
        })
        .from(gradeBooks)
        .where(eq(gradeBooks.bookId, book.id));

      const gradeNames = gradeData.map((g) => g.gradeName).filter(Boolean) as string[];

      // Build grades array: metadata + actual grade names
      const gradesArray: string[] = [];
      if (book.category) gradesArray.push(book.category);
      if (book.difficultyLevel) gradesArray.push(book.difficultyLevel);
      gradesArray.push(...gradeNames);

      await typesenseService.upsertDocuments('content', [
        {
          id: book.id,
          title: book.title,
          slug: book.slug,
          description: book.description || undefined,
          type: 'book',
          status: finalStatus,
          createdAt: book.createdAt ? new Date(book.createdAt).getTime() : Date.now(),
          bookId: undefined,
          topicId: undefined,
          grades: gradesArray.length > 0 ? gradesArray : undefined,
          coverImage: book.coverImage || undefined,
          popularityScore: 0,
        },
      ]);
    }

    return c.json(
      {
        success: true,
        message: 'Book created and published successfully',
        data: {
          id: book.id,
          slug: book.slug,
          title: book.title,
          status: finalStatus,
          createdAt: book.createdAt,
        },
        contribution: contributionData,
      },
      HttpStatusCodes.CREATED,
    );
  }

  return c.json(
    {
      success: true,
      message: 'Book created and submitted for review',
      data: {
        id: book.id,
        slug: book.slug,
        title: book.title,
        status: finalStatus,
        createdAt: book.createdAt,
      },
    },
    HttpStatusCodes.CREATED,
  );
};

export const createTopic: AppRouteHandler<CreateTopic> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const body = c.req.valid('json');
  const { user } = await getCurrentSession(c, true);

  const contribution = c.var.contribution;
  const gamificationService = c.var.gamificationService;
  const moderationService = c.var.moderationService;

  if (!contribution || !gamificationService || !moderationService) {
    throw new ApiError('Contribution system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  const bookId = await resolveBookId(client, { bookId: body.bookId, bookSlug: body.bookSlug });

  // Create topic
  const [topic] = await client
    .insert(topics)
    .values({
      bookId,
      title: body.title,
      slug: await generateUniqueTopicSlug(client, body.slug ?? body.title),
      description: body.description,
      orderIndex: body.orderIndex,
      status: 'DRAFT',
      createdBy: user.id,
    })
    .returning();

  // Determine final status
  const finalStatus = await determineContentStatus(
    contribution.isTrusted,
    moderationService,
    topic.id,
    'topic',
    user.id,
  );

  // Update status
  await client.update(topics).set({ status: finalStatus }).where(eq(topics.id, topic.id));

  // Indexing
  const typesenseService = c.var.typesenseService;
  if (typesenseService) {
    // Fetch parent book's grades
    const parentBook = await client.query.books.findFirst({
      where: eq(books.id, topic.bookId),
      columns: { category: true, difficultyLevel: true },
    });

    // Fetch grade names from gradeBooks junction table for the parent book
    const gradeData = await client
      .select({
        gradeName: sql`${client.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
      })
      .from(gradeBooks)
      .where(eq(gradeBooks.bookId, topic.bookId));

    const gradeNames = gradeData.map((g) => g.gradeName).filter(Boolean) as string[];

    // Build grades array: metadata + actual grade names
    const gradesArray: string[] = [];
    if (parentBook?.category) gradesArray.push(parentBook.category);
    if (parentBook?.difficultyLevel) gradesArray.push(parentBook.difficultyLevel);
    gradesArray.push(...gradeNames);

    await typesenseService.upsertDocuments('content', [
      {
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        description: topic.description || undefined,
        type: 'topic',
        status: finalStatus,
        createdAt: topic.createdAt ? new Date(topic.createdAt).getTime() : Date.now(),
        bookId: topic.bookId,
        topicId: undefined,
        grades: gradesArray.length > 0 ? gradesArray : undefined,
        coverImage: undefined,
        popularityScore: 0,
      },
    ]);
  }

  // Award CP/XP if published
  if (finalStatus === 'PUBLISHED') {
    const result = await gamificationService.awardPoints({
      userId: user.id,
      action: 'CREATE_TOPIC',
      referenceId: topic.id,
      referenceType: 'topic',
    });

    const contributionData = {
      cpEarned: result.cpDelta,
      xpEarned: result.xpDelta,
      newTotal: {
        cp: result.newCP,
        xp: result.newXP,
      },
    };

    const cache = c.var.provider.cache;
    if (cache) {
      await invalidateContributionCache(cache, user.id);
    }
    return c.json(
      {
        success: true,
        message: 'Topic created and published successfully',
        data: {
          id: topic.id,
          slug: topic.slug,
          title: topic.title,
          status: finalStatus,
          createdAt: topic.createdAt,
        },
        contribution: contributionData,
      },
      HttpStatusCodes.CREATED,
    );
  }

  return c.json(
    {
      success: true,
      message: 'Topic created and submitted for review',
      data: {
        id: topic.id,
        slug: topic.slug,
        title: topic.title,
        status: finalStatus,
        createdAt: topic.createdAt,
      },
    },
    HttpStatusCodes.CREATED,
  );
};

export const createSubtopic: AppRouteHandler<CreateSubtopic> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const body = c.req.valid('json');
  const { user } = await getCurrentSession(c, true);

  const contribution = c.var.contribution;
  const gamificationService = c.var.gamificationService;
  const moderationService = c.var.moderationService;

  if (!contribution || !gamificationService || !moderationService) {
    throw new ApiError('Contribution system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  const topicId = await resolveTopicId(client, { topicId: body.topicId, topicSlug: body.topicSlug });

  // Verify topic exists
  const topic = await client.query.topics.findFirst({
    where: eq(topics.id, topicId),
  });

  if (!topic) {
    throw new ApiError('Topic not found', HttpStatusCodes.NOT_FOUND);
  }

  // Create subtopic
  const [subtopic] = await client
    .insert(subtopics)
    .values({
      topicId,
      title: body.title,
      slug: await generateUniqueSubtopicSlug(client, body.slug ?? body.title),
      description: body.description,
      orderIndex: body.orderIndex,
      status: 'DRAFT',
      createdBy: user.id,
    })
    .returning();

  // Determine final status
  const finalStatus = await determineContentStatus(
    contribution.isTrusted,
    moderationService,
    subtopic.id,
    'subtopic',
    user.id,
  );

  // Update status
  await client.update(subtopics).set({ status: finalStatus }).where(eq(subtopics.id, subtopic.id));

  // Award CP/XP if published
  if (finalStatus === 'PUBLISHED') {
    const result = await gamificationService.awardPoints({
      userId: user.id,
      action: 'CREATE_SUBTOPIC',
      referenceId: subtopic.id,
      referenceType: 'subtopic',
    });

    const contributionData = {
      cpEarned: result.cpDelta,
      xpEarned: result.xpDelta,
      newTotal: {
        cp: result.newCP,
        xp: result.newXP,
      },
    };

    const cache = c.var.provider.cache;
    if (cache) {
      await invalidateContributionCache(cache, user.id);
    }

    // Indexing
    const typesenseService = c.var.typesenseService;
    if (typesenseService) {
      // Fetch parent topic to get bookId
      const parentTopic = await client.query.topics.findFirst({
        where: eq(topics.id, subtopic.topicId),
        columns: { bookId: true },
      });

      if (parentTopic) {
        // Fetch parent book's grades
        const parentBook = await client.query.books.findFirst({
          where: eq(books.id, parentTopic.bookId),
          columns: { category: true, difficultyLevel: true },
        });

        // Fetch grade names from gradeBooks junction table for the parent book
        const gradeData = await client
          .select({
            gradeName: sql`${client.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
          })
          .from(gradeBooks)
          .where(eq(gradeBooks.bookId, parentTopic.bookId));

        const gradeNames = gradeData.map((g) => g.gradeName).filter(Boolean) as string[];

        // Build grades array: metadata + actual grade names
        const gradesArray: string[] = [];
        if (parentBook?.category) gradesArray.push(parentBook.category);
        if (parentBook?.difficultyLevel) gradesArray.push(parentBook.difficultyLevel);
        gradesArray.push(...gradeNames);

        await typesenseService.upsertDocuments('content', [
          {
            id: subtopic.id,
            title: subtopic.title,
            slug: subtopic.slug,
            description: subtopic.description || undefined,
            type: 'subtopic',
            status: finalStatus,
            createdAt: subtopic.createdAt ? new Date(subtopic.createdAt).getTime() : Date.now(),
            bookId: undefined,
            topicId: subtopic.topicId,
            grades: gradesArray.length > 0 ? gradesArray : undefined,
            coverImage: undefined,
            popularityScore: 0,
          },
        ]);
      }
    }

    return c.json(
      {
        success: true,
        message: 'Subtopic created and published successfully',
        data: {
          id: subtopic.id,
          slug: subtopic.slug,
          title: subtopic.title,
          status: finalStatus,
          createdAt: subtopic.createdAt,
        },
        contribution: contributionData,
      },
      HttpStatusCodes.CREATED,
    );
  }

  return c.json(
    {
      success: true,
      message: 'Subtopic created and submitted for review',
      data: {
        id: subtopic.id,
        slug: subtopic.slug,
        title: subtopic.title,
        status: finalStatus,
        createdAt: subtopic.createdAt,
      },
    },
    HttpStatusCodes.CREATED,
  );
};

export const saveNoteDraft: AppRouteHandler<SaveNoteDraft> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const { user } = await getCurrentSession(c, true);

  // Check if note exists
  const existingNote = await client.query.notes.findFirst({
    where: eq(notes.id, id),
  });

  if (existingNote) {
    // Update existing draft
    if (existingNote.authorId !== user.id) {
      throw new ApiError('Unauthorized', HttpStatusCodes.UNAUTHORIZED);
    }

    if (existingNote.status !== 'DRAFT' && existingNote.status !== 'REJECTED') {
      throw new ApiError('Cannot edit published or pending content', HttpStatusCodes.BAD_REQUEST);
    }

    const [updated] = await client
      .update(notes)
      .set({
        title: body.title,
        slug: body.slug,
        content: body.content,
        contentType: body.contentType,
        topicId: body.topicId,
        subtopicId: body.subtopicId,
      })
      .where(eq(notes.id, id))
      .returning();

    return c.json(
      {
        success: true,
        message: 'Draft updated successfully',
        data: {
          id: updated.id,
          title: updated.title,
          status: 'DRAFT' as const,
          lastSavedAt: updated.updatedAt,
        },
      },
      HttpStatusCodes.OK,
    );
  }

  // Create new draft
  const [note] = await client
    .insert(notes)
    .values({
      id, // Use provided ID for idempotency
      title: body.title,
      slug: body.slug,
      content: body.content,
      contentType: body.contentType,
      topicId: body.topicId,
      subtopicId: body.subtopicId,
      authorId: user.id,
      status: 'DRAFT',
    })
    .returning();

  return c.json(
    {
      success: true,
      message: 'Draft created successfully',
      data: {
        id: note.id,
        title: note.title,
        status: 'DRAFT' as const,
        lastSavedAt: note.createdAt,
      },
    },
    HttpStatusCodes.OK,
  );
};

export const publishContent: AppRouteHandler<PublishContent> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { id } = c.req.valid('param');
  const { user } = await getCurrentSession(c, true);

  const contribution = c.var.contribution;
  const gamificationService = c.var.gamificationService;
  const moderationService = c.var.moderationService;

  if (!contribution || !gamificationService || !moderationService) {
    throw new ApiError('Contribution system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Find content (check all content types)
  const note = await client.query.notes.findFirst({ where: eq(notes.id, id) });
  const book = !note ? await client.query.books.findFirst({ where: eq(books.id, id) }) : null;
  const topic = !note && !book ? await client.query.topics.findFirst({ where: eq(topics.id, id) }) : null;

  const content = note || book || topic;
  const contentType = note ? 'note' : book ? 'book' : 'topic';
  const contentTable = note ? notes : book ? books : topics;

  if (!content) {
    throw new ApiError('Content not found', HttpStatusCodes.NOT_FOUND);
  }

  // Verify ownership
  const isAuthor = content && 'authorId' in content ? content.authorId === user.id : content.createdBy === user.id;

  if (!isAuthor) {
    throw new ApiError('Unauthorized', HttpStatusCodes.UNAUTHORIZED);
  }

  // Check current status
  if (content.status === 'PUBLISHED') {
    throw new ApiError('Content already published', HttpStatusCodes.BAD_REQUEST);
  }

  if (content.status === 'PENDING_REVIEW') {
    throw new ApiError('Content already pending review', HttpStatusCodes.BAD_REQUEST);
  }

  const fromStatus = content.status;

  // Determine final status
  const finalStatus = await determineContentStatus(contribution.isTrusted, moderationService, id, contentType, user.id);

  // Update status
  await client.update(contentTable).set({ status: finalStatus }).where(eq(contentTable.id, id));

  // Award CP/XP if published
  if (finalStatus === 'PUBLISHED') {
    const action = contentType === 'note' ? 'CREATE_NOTE' : contentType === 'book' ? 'CREATE_BOOK' : 'CREATE_TOPIC';

    const result = await gamificationService.awardPoints({
      userId: user.id,
      action,
      referenceId: id,
      referenceType: contentType,
    });

    const contributionData = {
      cpEarned: result.cpDelta,
      xpEarned: result.xpDelta,
    };

    const cache = c.var.provider.cache;
    if (cache) {
      await invalidateContributionCache(cache, user.id);
    }

    // Update Typesense with new status
    const typesenseService = c.var.typesenseService;
    if (typesenseService) {
      // Fetch grades based on content type
      let gradesArray: string[] | undefined;
      let bookIdValue: string | undefined;
      let topicIdValue: string | undefined;

      if (contentType === 'book' && book) {
        // For books: fetch grades directly
        const gradeData = await client
          .select({
            gradeName: sql`${client.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
          })
          .from(gradeBooks)
          .where(eq(gradeBooks.bookId, book.id));

        const gradeNames = gradeData.map((g) => g.gradeName).filter(Boolean) as string[];
        const tempGrades: string[] = [];
        if (book.category) tempGrades.push(book.category);
        if (book.difficultyLevel) tempGrades.push(book.difficultyLevel);
        tempGrades.push(...gradeNames);
        if (tempGrades.length > 0) gradesArray = tempGrades;
      } else if (contentType === 'topic' && topic) {
        // For topics: fetch from parent book
        bookIdValue = topic.bookId;
        const parentBook = await client.query.books.findFirst({
          where: eq(books.id, topic.bookId),
          columns: { category: true, difficultyLevel: true },
        });
        const gradeData = await client
          .select({
            gradeName: sql`${client.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
          })
          .from(gradeBooks)
          .where(eq(gradeBooks.bookId, topic.bookId));

        const gradeNames = gradeData.map((g) => g.gradeName).filter(Boolean) as string[];
        const tempGrades: string[] = [];
        if (parentBook?.category) tempGrades.push(parentBook.category);
        if (parentBook?.difficultyLevel) tempGrades.push(parentBook.difficultyLevel);
        tempGrades.push(...gradeNames);
        if (tempGrades.length > 0) gradesArray = tempGrades;
      } else if (contentType === 'note' && note) {
        // For notes: fetch from parent book via topic
        topicIdValue = note.topicId;
        const parentTopic = await client.query.topics.findFirst({
          where: eq(topics.id, note.topicId),
          columns: { bookId: true },
        });
        if (parentTopic) {
          const parentBook = await client.query.books.findFirst({
            where: eq(books.id, parentTopic.bookId),
            columns: { category: true, difficultyLevel: true },
          });
          const gradeData = await client
            .select({
              gradeName: sql`${client.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
            })
            .from(gradeBooks)
            .where(eq(gradeBooks.bookId, parentTopic.bookId));

          const gradeNames = gradeData.map((g) => g.gradeName).filter(Boolean) as string[];
          const tempGrades: string[] = [];
          if (parentBook?.category) tempGrades.push(parentBook.category);
          if (parentBook?.difficultyLevel) tempGrades.push(parentBook.difficultyLevel);
          tempGrades.push(...gradeNames);
          if (tempGrades.length > 0) gradesArray = tempGrades;
        }
      }

      await typesenseService.upsertDocuments('content', [
        {
          id,
          title: content.title,
          slug: content.slug,
          description: 'description' in content ? content.description || undefined : undefined,
          content: contentType === 'note' && note?.content ? note.content.substring(0, 1000) : undefined,
          type: contentType,
          status: finalStatus,
          createdAt: content.createdAt ? new Date(content.createdAt).getTime() : Date.now(),
          bookId: bookIdValue,
          topicId: topicIdValue,
          grades: gradesArray,
          coverImage: contentType === 'book' && book?.coverImage ? book.coverImage : undefined,
          popularityScore: 0,
        },
      ]);
    }

    return c.json(
      {
        success: true,
        message: 'Content published successfully',
        data: {
          id,
          from: fromStatus,
          to: finalStatus,
          publishedAt: finalStatus === 'PUBLISHED' ? new Date() : null,
          submittedAt: null,
        },
        contribution: contributionData,
      },
      HttpStatusCodes.OK,
    );
  }

  return c.json(
    {
      success: true,
      message: 'Content submitted for review. You will be notified once it is approved.',
      data: {
        id,
        from: fromStatus,
        to: finalStatus,
        publishedAt: null,
        submittedAt: finalStatus === 'PENDING_REVIEW' ? new Date() : null,
      },
    },
    HttpStatusCodes.OK,
  );
};

export const getContributionDashboard: AppRouteHandler<GetContributionDashboard> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);

  const gamificationService = c.var.gamificationService;
  if (!gamificationService) {
    throw new ApiError('Gamification system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Get user points
  const points = await gamificationService.getUserPoints(user.id);

  // Get contribution history
  const history = await gamificationService.getContributionHistory(user.id, 10);

  // Get content stats
  const [publishedCount] = await client
    .select({ count: count() })
    .from(notes)
    .where(and(eq(notes.authorId, user.id), eq(notes.status, 'PUBLISHED')));

  const [pendingCount] = await client
    .select({ count: count() })
    .from(notes)
    .where(and(eq(notes.authorId, user.id), eq(notes.status, 'PENDING_REVIEW')));

  const [rejectedCount] = await client
    .select({ count: count() })
    .from(notes)
    .where(and(eq(notes.authorId, user.id), eq(notes.status, 'REJECTED')));

  const [draftsCount] = await client
    .select({ count: count() })
    .from(notes)
    .where(and(eq(notes.authorId, user.id), eq(notes.status, 'DRAFT')));

  // Get pending content
  const pendingContent = await client
    .select({
      id: notes.id,
      title: notes.title,
      createdAt: notes.createdAt,
    })
    .from(notes)
    .where(and(eq(notes.authorId, user.id), eq(notes.status, 'PENDING_REVIEW')))
    .limit(5);

  // Get drafts
  const drafts = await client
    .select({
      id: notes.id,
      title: notes.title,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(and(eq(notes.authorId, user.id), eq(notes.status, 'DRAFT')))
    .limit(5);

  return c.json(
    {
      success: true,
      data: {
        user: {
          id: user.id,
          contributionPoints: points.cp,
          xp: points.xp,
          isTrusted: points.isTrusted,
          rank: points.isTrusted ? 'Trusted Contributor' : 'Contributor',
        },
        stats: {
          totalContributions: publishedCount.count + pendingCount.count,
          published: publishedCount.count,
          pending: pendingCount.count,
          rejected: rejectedCount.count,
          drafts: draftsCount.count,
        },
        recentActivity: history,
        pending: pendingContent.map((c) => ({
          id: c.id,
          type: 'note',
          title: c.title,
          submittedAt: c.createdAt,
          status: 'PENDING_REVIEW',
        })),
        drafts: drafts.map((d) => ({
          id: d.id,
          type: 'note',
          title: d.title,
          lastSavedAt: d.updatedAt,
        })),
      },
    },
    HttpStatusCodes.OK,
  );
};

export const createBulkTopics: AppRouteHandler<CreateBulkTopics> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const body = c.req.valid('json');
  const { user } = await getCurrentSession(c, true);

  const contribution = c.var.contribution;
  const moderationService = c.var.moderationService;

  if (!moderationService) {
    throw new ApiError('Moderation system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  const bookId = await resolveBookId(client, { bookId: body.bookId, bookSlug: body.bookSlug });
  const isTrusted = contribution?.isTrusted ?? false;

  const createdTopics: { id: string; slug: string; title: string; status: string }[] = [];

  for (const topicData of body.topics) {
    const [topic] = await client
      .insert(topics)
      .values({
        bookId,
        title: topicData.title,
        slug: await generateUniqueTopicSlug(client, topicData.slug),
        description: topicData.description,
        orderIndex: topicData.orderIndex,
        status: 'DRAFT',
        createdBy: user.id,
      })
      .returning();

    const status = await determineContentStatus(isTrusted, moderationService, topic.id, 'topic', user.id);
    await client.update(topics).set({ status }).where(eq(topics.id, topic.id));

    createdTopics.push({ id: topic.id, slug: topic.slug, title: topic.title, status });
  }

  return c.json(
    {
      success: true,
      message: 'Topics created successfully',
      data: createdTopics,
    },
    HttpStatusCodes.CREATED,
  );
};

export const createBulkSubtopics: AppRouteHandler<CreateBulkSubtopics> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const body = c.req.valid('json');
  const { user } = await getCurrentSession(c, true);

  const contribution = c.var.contribution;
  const moderationService = c.var.moderationService;

  if (!moderationService) {
    throw new ApiError('Moderation system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  const topicId = await resolveTopicId(client, { topicId: body.topicId, topicSlug: body.topicSlug });
  const isTrusted = contribution?.isTrusted ?? false;

  const createdSubtopics: { id: string; slug: string; title: string; status: string }[] = [];

  for (const subtopicData of body.subtopics) {
    const [subtopic] = await client
      .insert(subtopics)
      .values({
        topicId,
        title: subtopicData.title,
        slug: await generateUniqueSubtopicSlug(client, subtopicData.slug),
        description: subtopicData.description,
        orderIndex: subtopicData.orderIndex,
        status: 'DRAFT',
        createdBy: user.id,
      })
      .returning();

    const status = await determineContentStatus(isTrusted, moderationService, subtopic.id, 'subtopic', user.id);
    await client.update(subtopics).set({ status }).where(eq(subtopics.id, subtopic.id));

    createdSubtopics.push({ id: subtopic.id, slug: subtopic.slug, title: subtopic.title, status });
  }

  return c.json(
    {
      success: true,
      message: 'Subtopics created successfully',
      data: createdSubtopics,
    },
    HttpStatusCodes.CREATED,
  );
};

export const createNote: AppRouteHandler<CreateNote> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const body = c.req.valid('json');
  const { user } = await getCurrentSession(c, true);

  const topicId = await resolveTopicId(client, { topicId: body.topicId, topicSlug: body.topicSlug });
  const subtopicId = await resolveSubtopicId(client, { subtopicId: body.subtopicId, subtopicSlug: body.subtopicSlug });

  if (subtopicId) {
    const belongs = await client.query.subtopics.findFirst({
      where: and(eq(subtopics.id, subtopicId), eq(subtopics.topicId, topicId)),
      columns: { id: true },
    });
    if (!belongs) {
      throw new ApiError('Subtopic does not belong to the provided topic', HttpStatusCodes.UNPROCESSABLE_ENTITY);
    }
  }

  const visibility = body.isPublic ? 'PUBLIC' : 'PRIVATE';
  const accessLevel = body.isPremium ? 'PREMIUM' : body.price > 0 ? 'PAID' : 'FREE';

  const [note] = await client
    .insert(notes)
    .values({
      title: body.title,
      slug: body.slug,
      content: body.content,
      contentType: body.contentType,
      topicId,
      subtopicId,
      authorId: user.id,
      isPublic: body.isPublic,
      isPremium: body.isPremium,
      price: body.price,
      priceCents: Math.round((body.price ?? 0) * 100),
      visibility,
      accessLevel,
      status: 'DRAFT',
    })
    .returning();

  // Indexing
  const typesenseService = c.var.typesenseService;
  if (typesenseService) {
    // Fetch parent topic to get bookId
    const parentTopic = await client.query.topics.findFirst({
      where: eq(topics.id, note.topicId),
      columns: { bookId: true },
    });

    let gradesArray: string[] | undefined;
    if (parentTopic) {
      // Fetch parent book's grades
      const parentBook = await client.query.books.findFirst({
        where: eq(books.id, parentTopic.bookId),
        columns: { category: true, difficultyLevel: true },
      });

      // Fetch grade names from gradeBooks junction table for the parent book
      const gradeData = await client
        .select({
          gradeName: sql`${client.select({ name: grades.name }).from(grades).where(eq(grades.id, gradeBooks.gradeId))}`,
        })
        .from(gradeBooks)
        .where(eq(gradeBooks.bookId, parentTopic.bookId));

      const gradeNames = gradeData.map((g) => g.gradeName).filter(Boolean) as string[];

      // Build grades array: metadata + actual grade names
      const tempGrades: string[] = [];
      if (parentBook?.category) tempGrades.push(parentBook.category);
      if (parentBook?.difficultyLevel) tempGrades.push(parentBook.difficultyLevel);
      tempGrades.push(...gradeNames);

      if (tempGrades.length > 0) {
        gradesArray = tempGrades;
      }
    }

    await typesenseService.upsertDocuments('content', [
      {
        id: note.id,
        title: note.title,
        slug: note.slug,
        content: note.content ? note.content.substring(0, 1000) : undefined, // index snippet
        description: undefined,
        type: 'note',
        status: 'DRAFT',
        createdAt: note.createdAt ? new Date(note.createdAt).getTime() : Date.now(),
        bookId: undefined,
        topicId: note.topicId,
        grades: gradesArray,
        coverImage: undefined,
        popularityScore: 0,
      },
    ]);
  }

  return c.json(
    {
      success: true,
      message: 'Note created successfully',
      data: {
        id: note.id,
        slug: note.slug,
        title: note.title,
        status: 'DRAFT' as const,
        createdAt: note.createdAt,
      },
    },
    HttpStatusCodes.CREATED,
  );
};

export const getNote: AppRouteHandler<GetNote> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { id } = c.req.valid('param');
  const session = c.var.auth;
  const user = session?.user;

  const note = await client.query.notes.findFirst({
    where: eq(notes.id, id),
  });

  if (!note) {
    throw new ApiError('Note not found', HttpStatusCodes.NOT_FOUND);
  }

  if (note.deletedAt) {
    throw new ApiError('Note not found', HttpStatusCodes.NOT_FOUND);
  }

  const isAdmin = isAdminRole(user?.role ?? null);
  const isAuthor = !!user && note.authorId === user.id;

  // Draft/reviewed content is only visible to author/admin
  if (note.status !== 'PUBLISHED' && !isAuthor && !isAdmin) {
    throw new ApiError('Note not found', HttpStatusCodes.NOT_FOUND);
  }

  // Visibility rules (new schema)
  if (note.visibility === 'PRIVATE') {
    if (!user) throw new ApiError('Unauthorized', HttpStatusCodes.UNAUTHORIZED);
    if (!isAuthor && !isAdmin) {
      const canCollab = await canAccessPrivateNote(client, note.id, user.id);
      if (!canCollab) throw new ApiError('Forbidden', HttpStatusCodes.FORBIDDEN);
    }
  }

  // Backwards-compatible visibility
  if (!note.isPublic && !isAuthor && !isAdmin) {
    throw new ApiError('Forbidden', HttpStatusCodes.FORBIDDEN);
  }

  const baseUnlocked =
    note.accessLevel === 'FREE' && !note.isPremium && (note.priceCents ?? 0) === 0 && (note.price ?? 0) === 0;
  const isUnlocked = baseUnlocked || isAuthor || isAdmin || (await isNoteUnlocked(client, note, user?.id));
  const content = isUnlocked ? note.content : `${note.content.slice(0, 200)}... (Locked Content)`;

  const author = await getMinimalProfileById(note.authorId, c.env.AUTH_API_URL);

  return c.json(
    {
      success: true,
      data: {
        ...note,
        content,
        contentType: note.contentType,
        author,
        isUnlocked,
        isLiked: false,
      },
    },
    HttpStatusCodes.OK,
  );
};

export const getNoteBySlug: AppRouteHandler<GetNoteBySlug> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { slug } = c.req.valid('param');
  const session = c.var.auth;
  const user = session?.user;

  const note = await client.query.notes.findFirst({
    where: eq(notes.slug, slug),
  });

  if (!note || note.deletedAt) {
    throw new ApiError('Note not found', HttpStatusCodes.NOT_FOUND);
  }

  const isAdmin = isAdminRole(user?.role ?? null);
  const isAuthor = !!user && note.authorId === user.id;

  if (note.status !== 'PUBLISHED' && !isAuthor && !isAdmin) {
    throw new ApiError('Note not found', HttpStatusCodes.NOT_FOUND);
  }

  if (note.visibility === 'PRIVATE') {
    if (!user) throw new ApiError('Unauthorized', HttpStatusCodes.UNAUTHORIZED);
    if (!isAuthor && !isAdmin) {
      const canCollab = await canAccessPrivateNote(client, note.id, user.id);
      if (!canCollab) throw new ApiError('Forbidden', HttpStatusCodes.FORBIDDEN);
    }
  }

  if (!note.isPublic && !isAuthor && !isAdmin) {
    throw new ApiError('Forbidden', HttpStatusCodes.FORBIDDEN);
  }

  const baseUnlocked =
    note.accessLevel === 'FREE' && !note.isPremium && (note.priceCents ?? 0) === 0 && (note.price ?? 0) === 0;
  const isUnlocked = baseUnlocked || isAuthor || isAdmin || (await isNoteUnlocked(client, note, user?.id));
  const content = isUnlocked ? note.content : `${note.content.slice(0, 200)}... (Locked Content)`;

  const author = await getMinimalProfileById(note.authorId, c.env.AUTH_API_URL);

  return c.json(
    {
      success: true,
      data: {
        ...note,
        content,
        contentType: note.contentType,
        author,
        isUnlocked,
        isLiked: false,
      },
    },
    HttpStatusCodes.OK,
  );
};

export const getNotePreview: AppRouteHandler<GetNotePreview> = async (c) => {
  const cachedJson = await getCachedJSON(c, CACHE_DEFAULTS.NOTES);
  if (cachedJson) return c.json(cachedJson);

  const client = await c.var.provider.db.getClient();
  const { slug } = c.req.valid('param');

  const note = await client.query.notes.findFirst({
    where: eq(notes.slug, slug),
  });

  // Cacheable public preview only
  if (!note || note.deletedAt || note.status !== 'PUBLISHED' || note.visibility === 'PRIVATE' || !note.isPublic) {
    const responseJson = { success: true, data: null };
    await cacheJSON(c, responseJson, CACHE_DEFAULTS.NOTES);
    return c.json(responseJson, HttpStatusCodes.OK);
  }

  const responseJson = {
    success: true,
    data: {
      id: note.id,
      title: note.title,
      slug: note.slug,
      preview: `${note.content.slice(0, 200)}...`,
      contentType: note.contentType,
      authorId: note.authorId,
      topicId: note.topicId,
      subtopicId: note.subtopicId,
      isPublic: note.isPublic,
      isPremium: note.isPremium,
      price: note.price,
      priceCents: note.priceCents,
      currency: note.currency,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    },
  };

  await cacheJSON(c, responseJson, CACHE_DEFAULTS.NOTES);
  return c.json(responseJson, HttpStatusCodes.OK);
};

export const deleteNote: AppRouteHandler<DeleteNote> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { id } = c.req.valid('param');
  const { user } = await getCurrentSession(c, true);

  const note = await client.query.notes.findFirst({
    where: eq(notes.id, id),
  });

  if (!note) {
    throw new ApiError('Note not found', HttpStatusCodes.NOT_FOUND);
  }

  if (note.authorId !== user.id) {
    throw new ApiError('Unauthorized', HttpStatusCodes.UNAUTHORIZED);
  }

  await client.delete(notes).where(eq(notes.id, id));

  return c.json(
    {
      success: true,
      message: 'Note deleted successfully',
    },
    HttpStatusCodes.OK,
  );
};

export const getSimilarContent: AppRouteHandler<GetSimilarContent> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { id } = c.req.valid('param');

  const note = await client.query.notes.findFirst({ where: eq(notes.id, id) });

  const similar = [];
  if (note) {
    const siblings = await client.query.notes.findMany({
      where: and(eq(notes.topicId, note.topicId), sql`${notes.id} != ${id}`),
      limit: 5,
    });

    for (const s of siblings) {
      similar.push({
        id: s.id,
        title: s.title,
        slug: s.slug,
        type: 'note' as const,
        similarity: 0.8,
      });
    }
  }

  return c.json(
    {
      success: true,
      data: similar,
    },
    HttpStatusCodes.OK,
  );
};
