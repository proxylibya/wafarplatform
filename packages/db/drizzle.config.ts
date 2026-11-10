// The drizzle-kit configuration for the six tables and their migrations.
import { defineConfig } from 'drizzle-kit';

// Drizzle Kit is the single migration tool (CMV 1). The library's tables are
// declared in the same schema directory and migrated by the same tool.
export default defineConfig({
  dialect: 'postgresql',
  schema: './schema/index.ts',
  out: './migrations',
  casing: 'snake_case',
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://wafar:wafar@localhost:5432/wafar',
  },
});
