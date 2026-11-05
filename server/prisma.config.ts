import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const migrationDatasourceUrl =
  process.env.MIGRATE_DATABASE_URL ??
  process.env.DATABASE_URL;

const isPrismaMigrateCommand = process.argv.includes('migrate');

if (isPrismaMigrateCommand && !migrationDatasourceUrl) {
  throw new Error('MIGRATE_DATABASE_URL or DATABASE_URL must be set for Prisma migrations');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  ...(migrationDatasourceUrl
    ? {
        datasource: {
          url: migrationDatasourceUrl,
        },
      }
    : {}),
});
