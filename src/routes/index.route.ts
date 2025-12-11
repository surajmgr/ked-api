import type { AppOpenAPI } from '@/lib/types/init';
import system from './system/system.index';
import example from './example/example.index';
import books from './book/book.index';
import topics from './book/topic/topic.index';
import moderation from './moderation/moderation.index';
import learning from './learning/learning.index';
import qa from './qa/qa.index';
import content from './content/content.index';

export default function configureRoutes(app: AppOpenAPI) {
  const routes = [
    {
      path: '/public/sys',
      route: system,
    },
    {
      path: '/public/example',
      route: example,
    },
    {
      path: '/topic',
      route: topics,
    },
    {
      path: '/book',
      route: books,
    },
    {
      path: '/admin/moderation',
      route: moderation,
    },
    {
      path: '/learning',
      route: learning,
    },
    {
      path: '/qa',
      route: qa,
    },
    {
      path: '/content',
      route: content,
    },
  ];

  routes.forEach((route) => {
    app.route(route.path, route.route);
  });
}
