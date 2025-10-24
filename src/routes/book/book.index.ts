import { createRouter } from '@/lib/utils/init';
import * as handlers from './book.handler';
import * as routes from './book.route';

const books = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.get, handlers.get)
  .openapi(routes.create, handlers.create)
  .openapi(routes.update, handlers.update)
  .openapi(routes.active, handlers.active);

export default books;
