import { defineConfig } from 'prisma/config';

// Inject the CLI credential through the process environment. No runtime-role fallback.
// An absent URL permits offline validate/generate; database commands require it.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
