import init from './lib/utils/init';
import configureOpenAPI from './lib/utils/openapi';
import configureRoutes from '@/routes/index.route';

const app = init();

configureOpenAPI(app);
configureRoutes(app);

export default app;
