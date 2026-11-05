/**
 * Grant or revoke moderation powers (there is deliberately no UI for this):
 *   npm run set-role -w @tunetracker/data -- <username> MODERATOR|ADMIN|USER
 */
import { existsSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type ProfileRole } from '../src/generated/prisma/client';

if (existsSync('../.env')) process.loadEnvFile('../.env');
const [username, role] = process.argv.slice(2);
const roles: ProfileRole[] = ['USER', 'MODERATOR', 'ADMIN'];
if (!username || !roles.includes(role as ProfileRole)) {
  console.error('usage: set-role <username> USER|MODERATOR|ADMIN');
  process.exit(1);
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const updated = await db.profile
  .update({ where: { username: username.toLowerCase() }, data: { role: role as ProfileRole } })
  .catch(() => null);
await db.$disconnect();
if (!updated) {
  console.error(`No profile @${username}`);
  process.exit(1);
}
console.log(`@${updated.username} is now ${updated.role}`);
