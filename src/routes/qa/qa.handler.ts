import type { AppRouteHandler } from '@/lib/types/helper';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { questions, answers, votes, topics, subtopics } from '@/db/schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import type { SQL, AnyColumn } from 'drizzle-orm';
import { getCurrentSession } from '@/lib/utils/auth';
import { ApiError } from '@/lib/utils/error';
import { generateUniqueQuestionSlug } from '@/lib/utils/slugify';
import type {
  AskQuestion,
  AnswerQuestion,
  Vote,
  AcceptAnswer,
  ListQuestions,
  GetQuestion,
  GetQuestionBySlug,
} from './qa.route';
import { invalidateContributionCache } from '@/middleware/contribution';

export const askQuestion: AppRouteHandler<AskQuestion> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);
  const body = c.req.valid('json');

  const gamificationService = c.var.gamificationService;
  if (!gamificationService) {
    throw new ApiError('Gamification system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Generate unique slug
  const slug = await generateUniqueQuestionSlug(client, body.title);

  // Create question
  const [question] = await client
    .insert(questions)
    .values({
      slug,
      title: body.title,
      content: body.content,
      topicId: body.topicId,
      subtopicId: body.subtopicId,
      authorId: user.id,
      tags: body.tags || [],
    })
    .returning();

  // Award CP/XP for asking question
  const result = await gamificationService.awardPoints({
    userId: user.id,
    action: 'QUESTION_ASKED',
    referenceId: question.id,
    referenceType: 'question',
  });

  // Invalidate cache
  const cache = c.var.provider.cache;
  if (cache) {
    await invalidateContributionCache(cache, user.id);
  }

  // Indexing
  const typesenseService = c.var.typesenseService;
  if (typesenseService) {
    await typesenseService.upsertDocuments('questions', [
      {
        id: question.id,
        title: question.title,
        slug: question.slug,
        content: question.content,
        topicId: question.topicId,
        tags: question.tags || [],
        isSolved: false,
        popularityScore: 0,
        createdAt: question.createdAt ? new Date(question.createdAt).getTime() : Date.now(),
      },
    ]);
  }

  return c.json(
    {
      success: true,
      message: 'Question created successfully',
      data: {
        id: question.id,
        slug: question.slug,
        title: question.title,
        createdAt: question.createdAt,
      },
      contribution: {
        cpEarned: result.cpDelta,
        xpEarned: result.xpDelta,
      },
    },
    HttpStatusCodes.CREATED,
  );
};

export const answerQuestion: AppRouteHandler<AnswerQuestion> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);
  const { questionId } = c.req.valid('param');
  const { content } = c.req.valid('json');

  const gamificationService = c.var.gamificationService;
  if (!gamificationService) {
    throw new ApiError('Gamification system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Verify question exists
  const question = await client.query.questions.findFirst({
    where: eq(questions.id, questionId),
  });

  if (!question) {
    throw new ApiError('Question not found', HttpStatusCodes.NOT_FOUND);
  }

  // Create answer
  const [answer] = await client
    .insert(answers)
    .values({
      questionId,
      content,
      authorId: user.id,
    })
    .returning();

  // Update question answers count
  await client
    .update(questions)
    .set({
      answersCount: sql`${questions.answersCount} + 1`,
    })
    .where(eq(questions.id, questionId));

  // Award CP/XP for answering
  const result = await gamificationService.awardPoints({
    userId: user.id,
    action: 'ANSWER_QUESTION',
    referenceId: answer.id,
    referenceType: 'answer',
    metadata: { questionId },
  });

  // Invalidate cache
  const cache = c.var.provider.cache;
  if (cache) {
    await invalidateContributionCache(cache, user.id);
  }

  return c.json(
    {
      success: true,
      message: 'Answer created successfully',
      data: {
        id: answer.id,
        content: answer.content,
        createdAt: answer.createdAt,
      },
      contribution: {
        cpEarned: result.cpDelta,
        xpEarned: result.xpDelta,
      },
    },
    HttpStatusCodes.CREATED,
  );
};

export const vote: AppRouteHandler<Vote> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);
  const { type, id } = c.req.valid('param');
  const { voteType } = c.req.valid('json');

  const gamificationService = c.var.gamificationService;
  if (!gamificationService) {
    throw new ApiError('Gamification system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Determine table and author
  const isQuestion = type === 'questions';
  const table = isQuestion ? questions : answers;

  // Get content and author
  const [content] = await client.select().from(table).where(eq(table.id, id)).limit(1);

  if (!content) {
    throw new ApiError(`${isQuestion ? 'Question' : 'Answer'} not found`, HttpStatusCodes.NOT_FOUND);
  }

  const authorId = content.authorId;

  // Check if user already voted
  const whereConditions = [eq(votes.userId, user.id)];

  if (isQuestion) {
    whereConditions.push(eq(votes.questionId, id));
  } else {
    whereConditions.push(eq(votes.answerId, id));
  }

  const [existingVote] = await client
    .select()
    .from(votes)
    .where(and(...whereConditions))
    .limit(1);

  let voteDelta = 0;

  if (existingVote) {
    if (existingVote.voteType === voteType) {
      // Remove vote (toggle)
      await client.delete(votes).where(eq(votes.id, existingVote.id));
      voteDelta = voteType === 'UPVOTE' ? -1 : 1;
    } else {
      // Change vote
      await client.update(votes).set({ voteType }).where(eq(votes.id, existingVote.id));
      voteDelta = voteType === 'UPVOTE' ? 2 : -2;
    }
  } else {
    // New vote
    await client.insert(votes).values({
      userId: user.id,
      questionId: isQuestion ? id : null,
      answerId: !isQuestion ? id : null,
      voteType,
    });
    voteDelta = voteType === 'UPVOTE' ? 1 : -1;
  }

  // Update votes count
  await client
    .update(table)
    .set({
      votesCount: sql`${table.votesCount} + ${voteDelta}`,
    })
    .where(eq(table.id, id));

  // Award/deduct CP for author (only on upvotes/downvotes, not on toggle)
  let cpChange = 0;
  if (!existingVote || existingVote.voteType !== voteType) {
    const action = voteType === 'UPVOTE' ? 'UPVOTE_RECEIVED' : 'DOWNVOTE_RECEIVED';
    const result = await gamificationService.awardPoints({
      userId: authorId,
      action,
      referenceId: id,
      referenceType: isQuestion ? 'question' : 'answer',
      metadata: { voterId: user.id },
    });
    cpChange = result.cpDelta;

    // Invalidate author cache
    const cache = c.var.provider.cache;
    if (cache) {
      await invalidateContributionCache(cache, authorId);
    }
  }

  // Get updated votes count
  const [updated] = await client.select().from(table).where(eq(table.id, id)).limit(1);

  return c.json(
    {
      success: true,
      message: 'Vote recorded successfully',
      data: {
        id,
        voteType,
        votesCount: updated.votesCount,
      },
      authorContribution: cpChange !== 0 ? { cpChange } : undefined,
    },
    HttpStatusCodes.OK,
  );
};

export const acceptAnswer: AppRouteHandler<AcceptAnswer> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { user } = await getCurrentSession(c, true);
  const { questionId, answerId } = c.req.valid('param');

  const gamificationService = c.var.gamificationService;
  if (!gamificationService) {
    throw new ApiError('Gamification system not available', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Verify question exists and user is the author
  const question = await client.query.questions.findFirst({
    where: eq(questions.id, questionId),
  });

  if (!question) {
    throw new ApiError('Question not found', HttpStatusCodes.NOT_FOUND);
  }

  if (question.authorId !== user.id) {
    throw new ApiError('Only question author can accept answers', HttpStatusCodes.FORBIDDEN);
  }

  // Verify answer exists and belongs to this question
  const answer = await client.query.answers.findFirst({
    where: and(eq(answers.id, answerId), eq(answers.questionId, questionId)),
  });

  if (!answer) {
    throw new ApiError('Answer not found', HttpStatusCodes.NOT_FOUND);
  }

  // Mark question as solved
  await client.update(questions).set({ isSolved: true }).where(eq(questions.id, questionId));

  // Mark answer as accepted
  await client.update(answers).set({ isAccepted: true }).where(eq(answers.id, answerId));

  // Award CP/XP to answer author
  const result = await gamificationService.awardPoints({
    userId: answer.authorId,
    action: 'ANSWER_ACCEPTED',
    referenceId: answerId,
    referenceType: 'answer',
    metadata: { questionId },
  });

  // Invalidate cache
  const cache = c.var.provider.cache;
  if (cache) {
    await invalidateContributionCache(cache, answer.authorId);
  }

  // Update Typesense with isSolved status
  const typesenseService = c.var.typesenseService;
  if (typesenseService) {
    // Fetch question details for upsert
    const updatedQuestion = await client.query.questions.findFirst({
      where: eq(questions.id, questionId),
    });

    if (updatedQuestion) {
      await typesenseService.upsertDocuments('questions', [
        {
          id: updatedQuestion.id,
          title: updatedQuestion.title,
          slug: updatedQuestion.slug,
          content: updatedQuestion.content,
          topicId: updatedQuestion.topicId,
          tags: updatedQuestion.tags || [],
          isSolved: true,
          popularityScore: 0,
          createdAt: updatedQuestion.createdAt ? new Date(updatedQuestion.createdAt).getTime() : Date.now(),
        },
      ]);
    }
  }

  return c.json(
    {
      success: true,
      message: 'Answer accepted successfully',
      data: {
        questionId,
        answerId,
        isSolved: true,
      },
      authorContribution: {
        cpEarned: result.cpDelta,
        xpEarned: result.xpDelta,
      },
    },
    HttpStatusCodes.OK,
  );
};

export const listQuestions: AppRouteHandler<ListQuestions> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { topicId, topicSlug, subtopicId, subtopicSlug, solved, sortBy, limit } = c.req.valid('query');

  // Build where conditions
  const conditions = [];
  if (topicId) {
    conditions.push(eq(questions.topicId, topicId));
  } else if (topicSlug) {
    const topic = await client.query.topics.findFirst({
      where: eq(topics.slug, topicSlug),
      columns: { id: true },
    });
    if (!topic) {
      return c.json({ success: true, message: 'Questions retrieved successfully', data: [] }, HttpStatusCodes.OK);
    }
    conditions.push(eq(questions.topicId, topic.id));
  }

  if (subtopicId) {
    conditions.push(eq(questions.subtopicId, subtopicId));
  } else if (subtopicSlug) {
    const subtopic = await client.query.subtopics.findFirst({
      where: eq(subtopics.slug, subtopicSlug),
      columns: { id: true },
    });
    if (!subtopic) {
      return c.json({ success: true, message: 'Questions retrieved successfully', data: [] }, HttpStatusCodes.OK);
    }
    conditions.push(eq(questions.subtopicId, subtopic.id));
  }
  if (solved !== undefined) conditions.push(eq(questions.isSolved, solved));

  // Build order by
  let orderBy: SQL | AnyColumn;
  switch (sortBy) {
    case 'votes':
      orderBy = desc(questions.votesCount);
      break;
    case 'views':
      orderBy = desc(questions.viewsCount);
      break;
    case 'unanswered':
      orderBy = sql`${questions.answersCount} ASC, ${questions.createdAt} DESC`;
      break;
    default:
      orderBy = desc(questions.createdAt);
  }

  const questionsList = await client
    .select()
    .from(questions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit);

  return c.json(
    {
      success: true,
      message: 'Questions retrieved successfully',
      data: questionsList,
    },
    HttpStatusCodes.OK,
  );
};

export const getQuestion: AppRouteHandler<GetQuestion> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { questionId } = c.req.valid('param');

  // Hybrid Auth
  const session = await getCurrentSession(c, false);
  const user = session?.user;

  // Get question
  const question = await client.query.questions.findFirst({
    where: eq(questions.id, questionId),
  });

  if (!question) {
    throw new ApiError('Question not found', HttpStatusCodes.NOT_FOUND);
  }

  // Increment views count
  // TODO: Use Redis for efficient view counting to avoid DB writes on every read
  await client
    .update(questions)
    .set({
      viewsCount: sql`${questions.viewsCount} + 1`,
    })
    .where(eq(questions.id, questionId));

  // Get answers
  const questionAnswers = await client
    .select()
    .from(answers)
    .where(eq(answers.questionId, questionId))
    .orderBy(desc(answers.votesCount), desc(answers.createdAt));

  // Enriched Data
  let questionUserVote = null;
  const answerUserVotes: Record<string, 'UPVOTE' | 'DOWNVOTE'> = {};

  if (user) {
    // Specific query for Question Vote
    const [qVote] = await client
      .select()
      .from(votes)
      .where(and(eq(votes.userId, user.id), eq(votes.questionId, questionId)));

    if (qVote) {
      questionUserVote = qVote.voteType as 'UPVOTE' | 'DOWNVOTE';
    }

    if (questionAnswers.length > 0) {
      const aIds = questionAnswers.map((a) => a.id);

      // Optimization: Fetch all answer votes in one query using inArray
      const aVotes = await client
        .select()
        .from(votes)
        .where(and(eq(votes.userId, user.id), inArray(votes.answerId, aIds)));

      for (const v of aVotes) {
        if (v.answerId && v.voteType) {
          answerUserVotes[v.answerId] = v.voteType as 'UPVOTE' | 'DOWNVOTE';
        }
      }
    }
  }

  return c.json(
    {
      success: true,
      data: {
        question: {
          ...question,
          viewsCount: question.viewsCount + 1,
          userVote: questionUserVote,
          isAuthor: user ? question.authorId === user.id : false,
        },
        answers: questionAnswers.map((a) => ({
          ...a,
          userVote: answerUserVotes[a.id] || null,
          isAuthor: user ? a.authorId === user.id : false,
        })),
      },
    },
    HttpStatusCodes.OK,
  );
};

export const getQuestionBySlug: AppRouteHandler<GetQuestionBySlug> = async (c) => {
  const client = await c.var.provider.db.getClient();
  const { slug } = c.req.valid('param');

  // Hybrid Auth
  const session = await getCurrentSession(c, false);
  const user = session?.user;

  const question = await client.query.questions.findFirst({
    where: eq(questions.slug, slug),
  });

  if (!question) {
    throw new ApiError('Question not found', HttpStatusCodes.NOT_FOUND);
  }

  // Increment views count
  await client
    .update(questions)
    .set({
      viewsCount: sql`${questions.viewsCount} + 1`,
    })
    .where(eq(questions.id, question.id));

  const questionAnswers = await client
    .select()
    .from(answers)
    .where(eq(answers.questionId, question.id))
    .orderBy(desc(answers.votesCount), desc(answers.createdAt));

  let questionUserVote = null;
  const answerUserVotes: Record<string, 'UPVOTE' | 'DOWNVOTE'> = {};

  if (user) {
    const [qVote] = await client
      .select()
      .from(votes)
      .where(and(eq(votes.userId, user.id), eq(votes.questionId, question.id)));

    if (qVote) {
      questionUserVote = qVote.voteType as 'UPVOTE' | 'DOWNVOTE';
    }

    if (questionAnswers.length > 0) {
      const aIds = questionAnswers.map((a) => a.id);
      const aVotes = await client
        .select()
        .from(votes)
        .where(and(eq(votes.userId, user.id), inArray(votes.answerId, aIds)));

      for (const v of aVotes) {
        if (v.answerId && v.voteType) {
          answerUserVotes[v.answerId] = v.voteType as 'UPVOTE' | 'DOWNVOTE';
        }
      }
    }
  }

  return c.json(
    {
      success: true,
      data: {
        question: {
          ...question,
          viewsCount: question.viewsCount + 1,
          userVote: questionUserVote,
          isAuthor: user ? question.authorId === user.id : false,
        },
        answers: questionAnswers.map((a) => ({
          ...a,
          userVote: answerUserVotes[a.id] || null,
          isAuthor: user ? a.authorId === user.id : false,
        })),
      },
    },
    HttpStatusCodes.OK,
  );
};
