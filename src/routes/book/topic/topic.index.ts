import { createRouter } from '@/lib/utils/init';
import * as handlers from './topic.handler';
import * as routes from './topic.route';

const topics = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.listByBookSlug, handlers.listByBookSlug)
  .openapi(routes.listSubtopics, handlers.listSubtopics)
  .openapi(routes.listSubtopicsBySlug, handlers.listSubtopicsBySlug)
  .openapi(routes.get, handlers.get)
  .openapi(routes.getSubtopicBySlug, handlers.getSubtopicBySlug)
  .openapi(routes.getFeaturedNote, handlers.getFeaturedNote);

export default topics;
