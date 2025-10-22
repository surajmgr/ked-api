import type { RouteConfig, RouteHandler, z } from '@hono/zod-openapi';
import type { AppBindings } from './init';

// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
export type ZodSchema = z.ZodUnion | z.AnyZodObject | z.ZodArray<z.AnyZodObject>;
export type ZodIssue = z.core.$ZodIssue;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;
