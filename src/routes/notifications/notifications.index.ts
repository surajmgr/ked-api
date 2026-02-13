import { createRouter } from '@/lib/utils/init';
import * as handlers from './notifications.handler';
import * as routes from './notifications.route';

const notifications = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.markRead, handlers.markRead)
  .openapi(routes.markAllRead, handlers.markAllRead);

export default notifications;
