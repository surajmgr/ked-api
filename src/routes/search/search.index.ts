import { createRouter } from '@/lib/utils/init';
import * as handlers from './search.handler';
import * as routes from './search.route';

const router = createRouter()
    .openapi(routes.searchContentFunc, handlers.searchContent)
    .openapi(routes.searchQuestionFunc, handlers.searchQuestion)
    .openapi(routes.searchSuggestionsFunc, handlers.searchSuggestions);

export default router;
