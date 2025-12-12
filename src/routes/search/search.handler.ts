import type { AppRouteHandler } from '@/lib/types/helper';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { ApiError } from '@/lib/utils/error';
import type { SearchContent, SearchQuestion, SearchSuggestions } from './search.route';

export const searchContent: AppRouteHandler<SearchContent> = async (c) => {
    const params = c.req.valid('query');
    const typesenseService = c.var.typesenseService;

    if (!typesenseService) {
        throw new ApiError('Search service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
    }

    try {
        const results = await typesenseService.get('content').service.searchGeneral(params);

        return c.json({
            success: true,
            data: results,
        }, HttpStatusCodes.OK);
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
        const results = await typesenseService.get('questions').service.searchGeneral(params);

        return c.json({
            success: true,
            data: results,
        }, HttpStatusCodes.OK);
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

        return c.json({
            success: true,
            data: results,
        }, HttpStatusCodes.OK);
    } catch (e) {
        console.error('Search failed', e);
        throw new ApiError('Search failed', HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
};
