import { createSelectSchema } from 'drizzle-zod';
import { notes } from '../content';

export const selectNoteSchema = createSelectSchema(notes);
