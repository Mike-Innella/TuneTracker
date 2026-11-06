import { randomBytes } from 'node:crypto';
import { db, type Prisma } from '@tunetracker/data';
import {
  articleListSchema,
  articleSchema,
  BUCKETS,
  type ArticleInput,
  type ArticleListInput,
} from '@tunetracker/shared';
import { AppError, notFound, parse } from '../../lib/errors';
import { rateLimit } from '../../lib/rate-limit';
import { htmlToText, sanitizeArticleHtml } from '../../lib/sanitize';
import { publicUrl } from '../../storage';

const authorSelect = { id: true, username: true, displayName: true, avatarPath: true } as const;
const include = {
  author: { select: authorSelect },
  cover: { select: { path: true } },
} satisfies Prisma.ArticleInclude;
type Row = Prisma.ArticleGetPayload<{ include: typeof include }>;

const WORDS_PER_MINUTE = 220;

function present(a: Row, viewerId: string | null) {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt ?? (a.bodyText.length > 220 ? `${a.bodyText.slice(0, 217)}…` : a.bodyText),
    bodyHtml: a.bodyHtml,
    category: a.category,
    tags: a.tags,
    status: a.status,
    publishedAt: a.publishedAt,
    updatedAt: a.updatedAt,
    readingMinutes: Math.max(1, Math.round(a.bodyText.split(' ').filter(Boolean).length / WORDS_PER_MINUTE)),
    coverUrl: publicUrl(a.cover?.path),
    coverId: a.coverId,
    author: { ...a.author, avatarUrl: publicUrl(a.author.avatarPath) },
    isMine: a.authorId === viewerId,
    /** the author's own summary (null = generated from the body); only for the author */
    ownExcerpt: a.authorId === viewerId ? a.excerpt : null,
  };
}
export type PublicArticle = ReturnType<typeof present>;

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'article';

/** Validates, sanitizes and checks the cover; the stored HTML is always the sanitized form. */
async function prepare(actorId: string, input: ArticleInput) {
  const data = parse(articleSchema, input);
  const bodyHtml = sanitizeArticleHtml(data.bodyHtml);
  const bodyText = htmlToText(bodyHtml);
  if (data.coverId) {
    const c = await db().mediaAsset.findUnique({ where: { id: data.coverId } });
    if (!c || c.ownerId !== actorId || c.kind !== 'IMAGE' || c.bucket !== BUCKETS.public || !c.verifiedAt) {
      throw new AppError(400, 'Cover image not found');
    }
  }
  // one spelling per tag, so tag links and related articles line up
  const tags = [...new Set(data.tags.map((t) => t.replace(/^#+/, '').trim().toLowerCase()).filter(Boolean))];
  return { ...data, tags, bodyHtml, bodyText, excerpt: data.excerpt ?? null };
}

async function ownArticle(actorId: string, id: string) {
  const a = await db().article.findUnique({ where: { id } });
  if (!a || a.authorId !== actorId) throw notFound('Article not found');
  return a;
}

export async function createArticle(actorId: string, input: ArticleInput) {
  await rateLimit(`article:${actorId}`, 20, 3600);
  const data = await prepare(actorId, input);
  const slug = `${slugify(data.title)}-${randomBytes(3).toString('hex')}`;
  return db().article.create({ data: { ...data, slug, authorId: actorId } });
}

/** The slug stays put after creation, so shared links never break when a title changes. */
export async function updateArticle(actorId: string, id: string, input: ArticleInput) {
  await ownArticle(actorId, id);
  return db().article.update({ where: { id }, data: await prepare(actorId, input) });
}

export async function publishArticle(actorId: string, id: string) {
  const a = await ownArticle(actorId, id);
  if (!a.bodyText.trim()) throw new AppError(400, 'Write something before publishing');
  // the status guard makes a double click publish once
  await db().article.updateMany({
    where: { id, status: 'DRAFT' },
    data: { status: 'PUBLISHED', publishedAt: a.publishedAt ?? new Date() },
  });
  return db().article.findUniqueOrThrow({ where: { id } });
}

export async function unpublishArticle(actorId: string, id: string) {
  await ownArticle(actorId, id);
  return db().article.update({ where: { id }, data: { status: 'DRAFT' } });
}

/** shortcut: keeps the cover image file (it may be reused); sweep orphaned uploads if storage grows. */
export async function deleteArticle(actorId: string, id: string) {
  await ownArticle(actorId, id);
  await db().article.delete({ where: { id } });
}

/** Published articles are public; drafts are 404 to everyone but their author. */
export async function getArticle(viewerId: string | null, slug: string) {
  const a = await db().article.findUnique({ where: { slug }, include });
  if (!a || (a.status !== 'PUBLISHED' && a.authorId !== viewerId)) {
    throw notFound('Article not found');
  }
  return present(a, viewerId);
}

/** Owner view by id (editor). */
export async function getOwnArticle(actorId: string, id: string) {
  await ownArticle(actorId, id);
  return present(await db().article.findUniqueOrThrow({ where: { id }, include }), actorId);
}

const visible: Prisma.ArticleWhereInput = { status: 'PUBLISHED', author: { suspendedAt: null } };

export async function listArticles(viewerId: string | null, input: ArticleListInput = {}) {
  const f = parse(articleListSchema, input);
  const where: Prisma.ArticleWhereInput = {
    ...visible,
    ...(f.category ? { category: f.category } : {}),
    ...(f.tag ? { tags: { has: f.tag } } : {}),
    ...(f.q
      ? {
          OR: [
            { title: { contains: f.q, mode: 'insensitive' } },
            { excerpt: { contains: f.q, mode: 'insensitive' } },
            { bodyText: { contains: f.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const rows = await db().article.findMany({
    where,
    include,
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: f.limit + 1,
    ...(f.cursor ? { cursor: { id: f.cursor }, skip: 1 } : {}),
  });
  const page = rows.slice(0, f.limit);
  return {
    articles: page.map((a) => present(a, viewerId)),
    nextCursor: rows.length > f.limit ? (page[page.length - 1]?.id ?? null) : null,
  };
}

/** Same category or a shared tag, newest first; never the article itself. */
export async function relatedArticles(article: Pick<PublicArticle, 'id' | 'category' | 'tags'>, limit = 3) {
  const rows = await db().article.findMany({
    where: {
      ...visible,
      id: { not: article.id },
      OR: [
        { category: article.category },
        ...(article.tags.length ? [{ tags: { hasSome: article.tags } }] : []),
      ],
    },
    include,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
  return rows.map((a) => present(a, null));
}

export async function myArticles(actorId: string) {
  const rows = await db().article.findMany({
    where: { authorId: actorId },
    include,
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map((a) => present(a, actorId));
}
