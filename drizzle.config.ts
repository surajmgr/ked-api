import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { getDevDatabaseUrl } from "@/lib/utils/db";

config({
  path: ".dev.vars",
});

const DATABASE_URL = getDevDatabaseUrl();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  dbCredentials: {
    url: DATABASE_URL
  },
});
