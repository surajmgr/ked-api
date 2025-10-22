import { createRouter } from '@/lib/utils/init';
import * as handlers from './example.handler';
import * as routes from './example.route';

const example = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.get, handlers.get)
  .openapi(routes.create, handlers.create)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove);

export default example;
