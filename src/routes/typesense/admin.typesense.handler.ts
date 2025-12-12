import type { AppRouteHandler } from '@/lib/types/helper';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { ApiError } from '@/lib/utils/error';
import { ANALYTICS_RULES, type AnalyticsRuleName } from '@/lib/services/typesense.service';
import type {
  CreateCollection,
  DeleteCollection,
  GetCollectionInfo,
  CreateAnalyticsRule,
  DeleteAnalyticsRule,
  GetAnalyticsRules,
  SeedTypesense,
  ReindexTypesense,
} from './admin.typesense.route';

export const createCollection: AppRouteHandler<CreateCollection> = async (c) => {
  const { name, force } = c.req.valid('json');
  const typesenseService = c.var.typesenseService;

  if (!typesenseService) {
    throw new ApiError('Typesense service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
  }

  try {
    await typesenseService.createCollection(name, force);
    return c.json({ success: true, message: `Successfully created ${name}` }, HttpStatusCodes.OK);
  } catch (error) {
    throw new ApiError(
      `Failed to create ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const deleteCollection: AppRouteHandler<DeleteCollection> = async (c) => {
  const { name } = c.req.valid('param');
  const typesenseService = c.var.typesenseService;

  if (!typesenseService) {
    throw new ApiError('Typesense service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
  }

  try {
    await typesenseService.deleteCollection(name);
    return c.json({ success: true, message: `Successfully deleted ${name}` }, HttpStatusCodes.OK);
  } catch (error) {
    console.error(error);
    throw new ApiError(`Failed to delete ${name}`, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const getCollectionInfo: AppRouteHandler<GetCollectionInfo> = async (c) => {
  const query = c.req.valid('query');
  const typesenseService = c.var.typesenseService;

  if (!typesenseService) {
    throw new ApiError('Typesense service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
  }

  try {
    const result: Record<string, { exists: boolean; num_documents?: number; name?: string; created_at?: number }> = {};
    const collections = query?.name
      ? [query.name]
      : (Object.keys(typesenseService.collections) as (keyof typeof typesenseService.collections)[]);

    for (const name of collections) {
      try {
        const schema = typesenseService.get(name).service.collectionSchema;
        const info = await schema.retrieve();
        result[name] = { exists: true, ...info };
      } catch (e) {
        console.error(e);
        result[name] = { exists: false };
      }
    }

    return c.json({ success: true, data: result, message: 'Collection info retrieved' }, HttpStatusCodes.OK);
  } catch (error) {
    console.error(error);
    throw new ApiError('Failed to retrieve collection info', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const createAnalyticsRule: AppRouteHandler<CreateAnalyticsRule> = async (c) => {
  const { name } = c.req.valid('json');
  const typesenseService = c.var.typesenseService;

  if (!typesenseService) {
    throw new ApiError('Typesense service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
  }

  try {
    await typesenseService.createAnalyticsRule(name as AnalyticsRuleName);
    return c.json({ success: true, message: `Successfully created rule ${name}` }, HttpStatusCodes.OK);
  } catch (error) {
    console.error(error);
    throw new ApiError(`Failed to create rule ${name}`, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const deleteAnalyticsRule: AppRouteHandler<DeleteAnalyticsRule> = async (c) => {
  const { name } = c.req.valid('param');
  const typesenseService = c.var.typesenseService;

  if (!typesenseService) {
    throw new ApiError('Typesense service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
  }

  try {
    await typesenseService.deleteAnalyticsRule(name as AnalyticsRuleName);
    return c.json({ success: true, message: `Successfully deleted rule ${name}` }, HttpStatusCodes.OK);
  } catch (error) {
    console.error(error);
    throw new ApiError(`Failed to delete rule ${name}`, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const getAnalyticsRules: AppRouteHandler<GetAnalyticsRules> = async (c) => {
  const typesenseService = c.var.typesenseService;
  if (!typesenseService) {
    throw new ApiError('Typesense service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
  }

  try {
    const rules = await typesenseService.getAnalyticsRules();
    return c.json({ success: true, data: rules, message: 'Rules retrieved' }, HttpStatusCodes.OK);
  } catch (error) {
    console.error(error);
    throw new ApiError('Failed to retrieve rules', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const seedTypesense: AppRouteHandler<SeedTypesense> = async (c) => {
  const { force } = c.req.valid('json');
  const typesenseService = c.var.typesenseService;

  if (!typesenseService) {
    throw new ApiError('Typesense service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
  }

  try {
    const results: string[] = [];

    // Seed Collections
    for (const name of Object.keys(typesenseService.collections)) {
      try {
        await typesenseService.createCollection(name as keyof typeof typesenseService.collections, force);
        results.push(`Created collection ${name}`);
      } catch (e) {
        console.error(e);
        results.push(`Failed to create collection ${name}`);
      }
    }

    // Seed Rules
    for (const name of Object.keys(ANALYTICS_RULES)) {
      try {
        await typesenseService.createAnalyticsRule(name as AnalyticsRuleName);
        results.push(`Created rule ${name}`);
      } catch (e) {
        console.error(e);
        results.push(`Failed to create rule ${name}`);
      }
    }

    return c.json({ success: true, message: results.join('\n') }, HttpStatusCodes.OK);
  } catch (error) {
    console.error(error);
    throw new ApiError('Seeding failed', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const reindexTypesense: AppRouteHandler<ReindexTypesense> = async (c) => {
  const { collection } = c.req.valid('json');
  const typesenseService = c.var.typesenseService;

  if (!typesenseService) {
    throw new ApiError('Typesense service unavailable', HttpStatusCodes.SERVICE_UNAVAILABLE);
  }

  try {
    const db = c.var.provider.db;
    const client = await db.getClient();
    await Promise.all([typesenseService.get('content').service.reindexBooks(client)]);
    return c.json({ success: true, message: `Successfully reindexed ${collection}` }, HttpStatusCodes.OK);
  } catch (error) {
    console.error(error);
    throw new ApiError('Reindexing failed', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};
