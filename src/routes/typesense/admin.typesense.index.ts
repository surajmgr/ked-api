import { createRouter } from '@/lib/utils/init';
import * as handlers from './admin.typesense.handler';
import * as routes from './admin.typesense.route';

const router = createRouter()
    .openapi(routes.createCollectionFunc, handlers.createCollection)
    .openapi(routes.deleteCollectionFunc, handlers.deleteCollection)
    .openapi(routes.getCollectionInfoFunc, handlers.getCollectionInfo)
    .openapi(routes.createAnalyticsRuleFunc, handlers.createAnalyticsRule)
    .openapi(routes.deleteAnalyticsRuleFunc, handlers.deleteAnalyticsRule)
    .openapi(routes.getAnalyticsRulesFunc, handlers.getAnalyticsRules)
    .openapi(routes.seedTypesenseFunc, handlers.seedTypesense);

export default router;
