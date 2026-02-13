import { createRouter } from '@/lib/utils/init';
import * as handlers from './upload.handler';
import * as routes from './upload.route';

const upload = createRouter().openapi(routes.upload, handlers.upload);

export default upload;
