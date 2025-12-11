import { createRouter } from '@/lib/utils/init';
import * as routes from './learning.route';
import * as handlers from './learning.handler';

const learning = createRouter()
  .openapi(routes.updateProgress, handlers.updateProgress)
  .openapi(routes.getLearningDashboard, handlers.getLearningDashboard)
  .openapi(routes.getLearningHistory, handlers.getLearningHistory)
  .openapi(routes.getNoteProgress, handlers.getNoteProgress);

export default learning;
