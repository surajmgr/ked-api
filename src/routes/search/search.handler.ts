import type { AppRouteHandler } from '@/lib/types/helper';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { ApiError } from '@/lib/utils/error';
import type { SearchContent, SearchQuestion, SearchSuggestions } from './search.route';
import type { Context } from 'hono';

const getUserId = (c: Context): string => {
  const auth = c.get('auth');
  if (auth?.user?.id) return auth.user.id;

  const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip');
  if (ip) return ip;

  const traceId = c.req.header('cf-ray') || c.req.header('x-request-id');
  if (traceId) return traceId;

  return 'anonymous';
};

export const searchContent: AppRouteHandler<SearchContent> = async (c) => {
  const params = c.req.valid('query');
  const typesenseService = c.var.typesenseService;

  if (!typesenseService) {
    throw new ApiError('Search service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
  }

  try {
    const userId = getUserId(c);
    const results = await typesenseService.get('content').service.searchGeneral(params, userId);

    return c.json(
      {
        success: true,
        data: results,
      },
      HttpStatusCodes.OK,
    );
  } catch (e) {
    console.error('Search failed', e);
    throw new ApiError('Search failed', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const searchQuestion: AppRouteHandler<SearchQuestion> = async (c) => {
  const params = c.req.valid('query');
  const typesenseService = c.var.typesenseService;

  if (!typesenseService) {
    throw new ApiError('Search service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
  }

  try {
    const userId = getUserId(c);
    const results = await typesenseService.get('questions').service.searchGeneral(params, userId);

    return c.json(
      {
        success: true,
        data: results,
      },
      HttpStatusCodes.OK,
    );
  } catch (e) {
    console.error('Search failed', e);
    throw new ApiError('Search failed', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const searchSuggestions: AppRouteHandler<SearchSuggestions> = async (c) => {
  const params = c.req.valid('query');
  const typesenseService = c.var.typesenseService;

  if (!typesenseService) {
    throw new ApiError('Search service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
  }

  try {
    const results = await typesenseService.get('popular_queries').service.getSuggestions(params);

    return c.json(
      {
        success: true,
        data: results,
      },
      HttpStatusCodes.OK,
    );
  } catch (e) {
    console.error('Search failed', e);
    throw new ApiError('Search failed', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};
