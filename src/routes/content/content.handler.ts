import type { AppRouteHandler } from '@/lib/types/helper';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { books, topics, subtopics, notes } from '@/db/schema';
import { eq, and, count, sql, or, ilike } from 'drizzle-orm';
import { getCurrentSession } from '@/lib/utils/auth';
import { ApiError } from '@/lib/utils/error';
import { generateUniqueBookSlug, generateUniqueTopicSlug, generateUniqueSubtopicSlug } from '@/lib/utils/slugify';
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
  CreateBulkTopics,
  CreateBulkSubtopics,
  CreateNote,
  GetNote,
  DeleteNote,
  GetSimilarContent,
} from './content.route';
import type { ModerationService } from '@/lib/services/moderation.service';
import { invalidateContributionCache } from '@/middleware/contribution';

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

export const listBooks: AppRouteHandler<ListBooks> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { page, limit, search, difficulty, category } = c.req.valid('query');

  const pageNum = parseInt(page || '1');
  const limitNum = parseInt(limit || '10');
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

  const pageNum = parseInt(page || '1');
  const limitNum = parseInt(limit || '10');
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

  const pageNum = parseInt(page || '1');
  const limitNum = parseInt(limit || '10');
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
      await typesenseService.upsertDocuments('content', [{
        id: book.id,
        title: book.title,
        slug: book.slug,
        description: book.description || undefined,
        type: 'book',
        createdAt: book.createdAt ? new Date(book.createdAt).getTime() : Date.now(),
        category: book.category || undefined,
        difficultyLevel: book.difficultyLevel,
        isSponsored: false,
        popularityScore: 0,
      }]);
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

  // Verify book exists
  const book = await client.query.books.findFirst({
    where: eq(books.id, body.bookId),
  });

  if (!book) {
    throw new ApiError('Book not found', HttpStatusCodes.NOT_FOUND);
  }

  // Create topic
  const [topic] = await client
    .insert(topics)
    .values({
      bookId: body.bookId,
      title: body.title,
      slug: await generateUniqueTopicSlug(client, body.slug),
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
    await typesenseService.upsertDocuments('content', [{
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      description: topic.description || undefined,
      type: 'topic',
      createdAt: topic.createdAt ? new Date(topic.createdAt).getTime() : Date.now(),
      bookId: topic.bookId,
      isSponsored: false,
      popularityScore: 0,
    }]);
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

  // Verify topic exists
  const topic = await client.query.topics.findFirst({
    where: eq(topics.id, body.topicId),
  });

  if (!topic) {
    throw new ApiError('Topic not found', HttpStatusCodes.NOT_FOUND);
  }

  // Create subtopic
  const [subtopic] = await client
    .insert(subtopics)
    .values({
      topicId: body.topicId,
      title: body.title,
      slug: await generateUniqueSubtopicSlug(client, body.slug),
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
      await typesenseService.upsertDocuments('content', [{
        id: subtopic.id,
        title: subtopic.title,
        slug: subtopic.slug,
        description: subtopic.description || undefined,
        type: 'subtopic',
        createdAt: subtopic.createdAt ? new Date(subtopic.createdAt).getTime() : Date.now(),
        isSponsored: false,
        popularityScore: 0,
      }]);
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

  const createdTopics = [];

  for (const topicData of body.topics) {
    const [topic] = await client
      .insert(topics)
      .values({
        bookId: body.bookId,
        title: topicData.title,
        slug: await generateUniqueTopicSlug(client, topicData.slug),
        description: topicData.description,
        orderIndex: topicData.orderIndex,
        status: 'DRAFT',
        createdBy: user.id,
      })
      .returning();

    createdTopics.push(topic);
  }

  const contribution = c.var.contribution;
  const isTrusted = contribution?.isTrusted ?? false;
  const status = isTrusted ? 'PUBLISHED' : 'PENDING_REVIEW';

  if (createdTopics.length > 0) {
    await client.update(topics)
      .set({ status: status as any })
      .where(and(eq(topics.bookId, body.bookId), sql`${topics.id} IN ${createdTopics.map(t => t.id)}`));
  }

  return c.json({
    success: true,
    message: 'Topics created successfully',
    data: createdTopics.map(t => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      status,
    }))
  }, HttpStatusCodes.CREATED);
};

export const createBulkSubtopics: AppRouteHandler<CreateBulkSubtopics> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const body = c.req.valid('json');
  const { user } = await getCurrentSession(c, true);

  const createdSubtopics = [];

  for (const subtopicData of body.subtopics) {
    const [subtopic] = await client
      .insert(subtopics)
      .values({
        topicId: body.topicId,
        title: subtopicData.title,
        slug: await generateUniqueSubtopicSlug(client, subtopicData.slug),
        description: subtopicData.description,
        orderIndex: subtopicData.orderIndex,
        status: 'DRAFT',
        createdBy: user.id,
      })
      .returning();

    createdSubtopics.push(subtopic);
  }

  const contribution = c.var.contribution;
  const isTrusted = contribution?.isTrusted ?? false;
  const status = isTrusted ? 'PUBLISHED' : 'PENDING_REVIEW';

  if (createdSubtopics.length > 0) {
    await client.update(subtopics)
      .set({ status: status as any })
      .where(and(eq(subtopics.topicId, body.topicId), sql`${subtopics.id} IN ${createdSubtopics.map(t => t.id)}`));
  }

  return c.json({
    success: true,
    message: 'Subtopics created successfully',
    data: createdSubtopics.map(t => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      status,
    }))
  }, HttpStatusCodes.CREATED);
};

export const createNote: AppRouteHandler<CreateNote> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const body = c.req.valid('json');
  const { user } = await getCurrentSession(c, true);

  const [note] = await client.insert(notes).values({
    title: body.title,
    slug: body.slug,
    content: body.content,
    contentType: body.contentType,
    topicId: body.topicId,
    subtopicId: body.subtopicId,
    authorId: user.id,
    isPublic: body.isPublic,
    isPremium: body.isPremium,
    price: body.price,
    status: 'DRAFT'
  }).returning();

  // Indexing
  const typesenseService = c.var.typesenseService;
  if (typesenseService) {
    await typesenseService.upsertDocuments('content', [{
      id: note.id,
      title: note.title,
      slug: note.slug,
      content: note.content ? note.content.substring(0, 1000) : '', // index snippet
      type: 'note',
      createdAt: note.createdAt ? new Date(note.createdAt).getTime() : Date.now(),
      authorId: note.authorId,
      isSponsored: false,
      popularityScore: 0,
    }]);
  }

  return c.json({
    success: true,
    message: 'Note created successfully',
    data: {
      id: note.id,
      slug: note.slug,
      title: note.title,
      status: 'DRAFT' as const,
      createdAt: note.createdAt,
    }
  }, HttpStatusCodes.CREATED);
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

  if (!note.isPublic) {
    if (!user || note.authorId !== user.id) {
      throw new ApiError('Unauthorized', HttpStatusCodes.UNAUTHORIZED);
    }
  }

  let content = note.content;
  let isUnlocked = false;

  if (note.isPremium) {
    if (user && note.authorId === user.id) {
      isUnlocked = true;
    } else {
      if (!isUnlocked) {
        content = content.slice(0, 200) + '... (Premium Content)';
      }
    }
  } else {
    isUnlocked = true;
  }

  return c.json({
    success: true,
    data: {
      ...note,
      content,
      contentType: note.contentType,
      author: { id: note.authorId, name: 'Unknown' },
      isUnlocked,
      isLiked: false,
    }
  }, HttpStatusCodes.OK);
}

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

  return c.json({
    success: true,
    message: 'Note deleted successfully'
  }, HttpStatusCodes.OK);
}

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
        type: 'note',
        similarity: 0.8
      });
    }
  }

  return c.json({
    success: true,
    data: similar as any
  }, HttpStatusCodes.OK);
};
