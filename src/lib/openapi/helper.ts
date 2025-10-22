import { z, type ZodError } from 'zod';
import type { ZodSchema } from '../types/helper';

export function formatZodErrors(error: ZodError): string[] {
  const flattened = z.flattenError(error);

  const formErrors = flattened.formErrors ?? [];
  const fieldErrors = Object.entries(flattened.fieldErrors ?? {}).flatMap(([field, messages]) =>
    ((messages as string[]) ?? []).map((msg) => `${field}: ${msg.toLowerCase()}`),
  );

  return [...formErrors, ...fieldErrors];
}

export const jsonReqContent = <T extends ZodSchema>({ schema, description }: { schema: T; description: string }) => {
  return {
    content: {
      'application/json': {
        schema,
      },
    },
    description,
  };
};

export const jsonReqContentRequired = <T extends ZodSchema>({
  schema,
  description,
}: {
  schema: T;
  description: string;
}) => {
  return {
    ...jsonReqContent({
      schema,
      description,
    }),
    required: true,
  };
};

type JsonContentOptions<T extends ZodSchema> = {
  schema: T;
  description: string;
};

export const jsonContentBase = ({ description }: { description: string }) => ({
  content: {
    'application/json': {
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
    },
  },
  description,
});

export const jsonContentRaw = <T extends ZodSchema>({ schema, description }: JsonContentOptions<T>) => ({
  content: {
    'application/json': {
      schema,
    },
  },
  description,
});

export const jsonContent = <T extends ZodSchema>({ schema, description }: JsonContentOptions<T>) => ({
  content: {
    'application/json': {
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        data: schema,
      }),
    },
  },
  description,
});

export const jsonContentWithPagination = <T extends ZodSchema>({ schema, description }: JsonContentOptions<T>) => {
  const pagination = z.object({
    next: z.object({
      cursor: z.string().optional(),
      more: z.boolean(),
    }),
    prev: z.object({
      cursor: z.string().optional(),
      more: z.boolean(),
    }),
    totalItems: z.number().optional(),
  });

  return jsonContent({
    schema: z.object({ pagination, result: schema }),
    description,
  });
};
