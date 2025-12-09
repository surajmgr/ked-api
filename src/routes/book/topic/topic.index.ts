import { createRouter } from '@/lib/utils/init';
import * as handlers from './topic.handler';
import * as routes from './topic.route';

const topics = createRouter().openapi(routes.list, handlers.list).openapi(routes.listSubtopics, handlers.listSubtopics).openapi(routes.get, handlers.get).openapi(routes.getFeaturedNote, handlers.getFeaturedNote);

export default topics;
