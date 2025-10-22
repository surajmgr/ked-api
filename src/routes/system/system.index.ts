import { createRouter } from '@/lib/utils/init';
import * as handlers from './system.handler';
import * as routes from './system.route';

const system = createRouter()
  .openapi(routes.healthRoute, handlers.healthHandler)
  .openapi(routes.dbHealthRoute, handlers.dbHealthHandler);

export default system;
