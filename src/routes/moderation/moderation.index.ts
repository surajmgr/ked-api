import { createRouter } from '@/lib/utils/init';
import * as routes from './moderation.route';
import * as handlers from './moderation.handler';

const moderation = createRouter()
  .openapi(routes.getPendingTasks, handlers.getPendingTasks)
  .openapi(routes.getTaskDetails, handlers.getTaskDetails)
  .openapi(routes.approveContent, handlers.approveContent)
  .openapi(routes.rejectContent, handlers.rejectContent);

export default moderation;
