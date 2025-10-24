import { timestamp } from 'drizzle-orm/pg-core';

export function nowMs() {
  const d = new Date();
  d.setUTCMilliseconds(Math.floor(d.getUTCMilliseconds())); // ensure 3ms precision
  return d;
}

export function timestampMs(name: string, update = false) {
  if (update)
    return timestamp(name, { mode: 'date' })
      .notNull()
      .default(nowMs())
      .$onUpdate(() => nowMs());
  return timestamp(name, { mode: 'date' }).notNull().default(nowMs());
}
