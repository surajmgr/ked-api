import type { AppRouteHandler } from '@/lib/types/helper';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { userProgress, notes, topics, books, type UpdateUserProgressSchema } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { getCurrentSession } from '@/lib/utils/auth';
import { ApiError } from '@/lib/utils/error';
import type { UpdateProgress, GetLearningDashboard, GetLearningHistory, GetNoteProgress } from './learning.route';

export const updateProgress: AppRouteHandler<UpdateProgress> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);
  const { noteId } = c.req.valid('param');
  const { status, readingTimeSeconds, bookmarked } = c.req.valid('json');

  const gamificationService = c.var.gamificationService;
  if (!gamificationService) {
    throw new ApiError('Gamification system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Verify note exists
  const note = await client.query.notes.findFirst({
    where: eq(notes.id, noteId),
  });

  if (!note) {
    throw new ApiError('Note not found', HttpStatusCodes.NOT_FOUND);
  }

  // Check if progress record exists
  const [existingProgress] = await client
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, user.id), eq(userProgress.noteId, noteId)))
    .limit(1);

  const now = new Date();

  if (existingProgress) {
    // Update existing progress
    const updateData: UpdateUserProgressSchema = {
      status,
      lastReadAt: now,
    };

    if (readingTimeSeconds !== undefined) {
      updateData.readingTimeSeconds = sql`${userProgress.readingTimeSeconds} + ${readingTimeSeconds}`;
    }

    if (bookmarked !== undefined) {
      updateData.bookmarked = bookmarked;
    }

    if (status === 'COMPLETED' && existingProgress.status !== 'COMPLETED') {
      updateData.completedAt = now;

      // Award CP/XP for completing a note
      await gamificationService.awardPoints({
        userId: user.id,
        action: 'READ_NOTE',
        referenceId: noteId,
        referenceType: 'note',
      });
    }

    if (status === 'IN_PROGRESS' && existingProgress.status === 'NOT_STARTED') {
      updateData.startedAt = now;
    }

    const [updated] = await client
      .update(userProgress)
      .set(updateData)
      .where(eq(userProgress.id, existingProgress.id))
      .returning();

    return c.json(
      {
        success: true,
        message: 'Progress updated successfully',
        data: {
          noteId: updated.noteId,
          status: updated.status,
          readingTimeSeconds: updated.readingTimeSeconds,
          completedAt: updated.completedAt,
          bookmarked: updated.bookmarked,
        },
      },
      HttpStatusCodes.OK,
    );
  }

  // Create new progress record
  const [newProgress] = await client
    .insert(userProgress)
    .values({
      userId: user.id,
      noteId,
      status,
      startedAt: status !== 'NOT_STARTED' ? now : undefined,
      completedAt: status === 'COMPLETED' ? now : undefined,
      lastReadAt: now,
      readingTimeSeconds: readingTimeSeconds ?? 0,
      bookmarked: bookmarked ?? false,
    })
    .returning();

  if (status === 'COMPLETED') {
    // Award CP/XP for completing a note
    await gamificationService.awardPoints({
      userId: user.id,
      action: 'READ_NOTE',
      referenceId: noteId,
      referenceType: 'note',
    });
  }

  return c.json(
    {
      success: true,
      message: 'Progress created successfully',
      data: {
        noteId: newProgress.noteId,
        status: newProgress.status,
        readingTimeSeconds: newProgress.readingTimeSeconds,
        completedAt: newProgress.completedAt,
        bookmarked: newProgress.bookmarked,
      },
    },
    HttpStatusCodes.OK,
  );
};

export const getLearningDashboard: AppRouteHandler<GetLearningDashboard> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);

  // Get stats
  const [statsResult] = await client
    .select({
      totalNotes: sql<number>`COUNT(*)`,
      completed: sql<number>`SUM(CASE WHEN ${userProgress.status} = 'COMPLETED' THEN 1 ELSE 0 END)`,
      inProgress: sql<number>`SUM(CASE WHEN ${userProgress.status} = 'IN_PROGRESS' THEN 1 ELSE 0 END)`,
      totalReadingTime: sql<number>`SUM(${userProgress.readingTimeSeconds})`,
    })
    .from(userProgress)
    .where(eq(userProgress.userId, user.id));

  // Get recently read notes
  const recentlyRead = await client
    .select({
      noteId: userProgress.noteId,
      noteTitle: notes.title,
      topicTitle: topics.title,
      bookTitle: books.title,
      lastReadAt: userProgress.lastReadAt,
      status: userProgress.status,
      readingTimeSeconds: userProgress.readingTimeSeconds,
    })
    .from(userProgress)
    .innerJoin(notes, eq(userProgress.noteId, notes.id))
    .innerJoin(topics, eq(notes.topicId, topics.id))
    .innerJoin(books, eq(topics.bookId, books.id))
    .where(eq(userProgress.userId, user.id))
    .orderBy(desc(userProgress.lastReadAt))
    .limit(10);

  // Get bookmarks
  const bookmarks = await client
    .select({
      noteId: userProgress.noteId,
      noteTitle: notes.title,
      topicTitle: topics.title,
      bookTitle: books.title,
      bookmarkedAt: userProgress.updatedAt,
    })
    .from(userProgress)
    .innerJoin(notes, eq(userProgress.noteId, notes.id))
    .innerJoin(topics, eq(notes.topicId, topics.id))
    .innerJoin(books, eq(topics.bookId, books.id))
    .where(and(eq(userProgress.userId, user.id), eq(userProgress.bookmarked, true)))
    .orderBy(desc(userProgress.updatedAt))
    .limit(10);

  // Calculate streak (simplified - days with activity)
  // TODO: Implement proper streak calculation
  const streak = 0;

  // Calculate progress percentage for recently read
  const recentlyReadWithProgress = recentlyRead.map((item) => ({
    ...item,
    progress: item.status === 'COMPLETED' ? 100 : item.status === 'IN_PROGRESS' ? 50 : 0,
  }));

  return c.json(
    {
      success: true,
      data: {
        stats: {
          totalNotes: Number(statsResult?.totalNotes || 0),
          completed: Number(statsResult?.completed || 0),
          inProgress: Number(statsResult?.inProgress || 0),
          totalReadingTime: Number(statsResult?.totalReadingTime || 0),
          streak,
        },
        recentlyRead: recentlyReadWithProgress,
        bookmarks,
        recommendations: [], // TODO: Implement recommendations
      },
    },
    HttpStatusCodes.OK,
  );
};

export const getLearningHistory: AppRouteHandler<GetLearningHistory> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);
  const { limit } = c.req.valid('query');

  const history = await client
    .select({
      noteId: userProgress.noteId,
      noteTitle: notes.title,
      topicTitle: topics.title,
      bookTitle: books.title,
      status: userProgress.status,
      startedAt: userProgress.startedAt,
      completedAt: userProgress.completedAt,
      readingTimeSeconds: userProgress.readingTimeSeconds,
    })
    .from(userProgress)
    .innerJoin(notes, eq(userProgress.noteId, notes.id))
    .innerJoin(topics, eq(notes.topicId, topics.id))
    .innerJoin(books, eq(topics.bookId, books.id))
    .where(eq(userProgress.userId, user.id))
    .orderBy(desc(userProgress.lastReadAt))
    .limit(limit);

  return c.json(
    {
      success: true,
      data: history,
    },
    HttpStatusCodes.OK,
  );
};

export const getNoteProgress: AppRouteHandler<GetNoteProgress> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);
  const { noteId } = c.req.valid('param');

  const [progress] = await client
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, user.id), eq(userProgress.noteId, noteId)))
    .limit(1);

  if (!progress) {
    // Return default progress
    return c.json(
      {
        success: true,
        data: {
          noteId,
          status: 'NOT_STARTED' as const,
          startedAt: null,
          completedAt: null,
          lastReadAt: null,
          readingTimeSeconds: 0,
          bookmarked: false,
        },
      },
      HttpStatusCodes.OK,
    );
  }

  return c.json(
    {
      success: true,
      data: {
        noteId: progress.noteId,
        status: progress.status,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        lastReadAt: progress.lastReadAt,
        readingTimeSeconds: progress.readingTimeSeconds,
        bookmarked: progress.bookmarked,
      },
    },
    HttpStatusCodes.OK,
  );
};
