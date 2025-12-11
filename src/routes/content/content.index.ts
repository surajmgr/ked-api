import { createRouter } from '@/lib/utils/init';
import * as routes from './content.route';
import * as handlers from './content.handler';

const content = createRouter()
  .openapi(routes.createBook, handlers.createBook)
  .openapi(routes.createTopic, handlers.createTopic)
  .openapi(routes.createSubtopic, handlers.createSubtopic)
  .openapi(routes.saveNoteDraft, handlers.saveNoteDraft)
  .openapi(routes.publishContent, handlers.publishContent)
  .openapi(routes.getContributionDashboard, handlers.getContributionDashboard);

export default content;
