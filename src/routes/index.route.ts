import type { AppOpenAPI } from '@/lib/types/init';
import system from './system/system.index';
import example from './example/example.index';
import books from './book/book.index';

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
      path: '/book',
      route: books,
    },
  ];

  routes.forEach((route) => {
    app.route(route.path, route.route);
  });
}
