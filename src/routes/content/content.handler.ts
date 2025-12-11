import type { AppRouteHandler } from '@/lib/types/helper';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { books, topics, subtopics, notes } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getCurrentSession } from '@/lib/utils/auth';
import { ApiError } from '@/lib/utils/error';
import { generateUniqueBookSlug } from '@/lib/utils/slugify';
import type {
  CreateBook,
  CreateTopic,
  CreateSubtopic,
  SaveNoteDraft,
  PublishContent,
  GetContributionDashboard,
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
      slug: body.slug,
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
      slug: body.slug,
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
