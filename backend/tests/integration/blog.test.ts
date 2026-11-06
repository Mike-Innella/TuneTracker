import { describe, expect, it, vi } from 'vitest';
import { db } from '@tunetracker/data';

vi.mock('../../src/storage', () => ({
  removeObjects: vi.fn(async () => {}),
  publicUrl: (p: string | null | undefined) => (p ? `public://${p}` : null),
  signedReadUrls: vi.fn(async () => new Map()),
}));
vi.mock('../../src/auth/supabase', () => ({
  supabaseAdmin: () => ({ auth: { admin: { updateUserById: vi.fn(async () => ({ error: null })) } } }),
  supabaseServer: vi.fn(),
}));

const blog = await import('../../src/services/blog');
const community = await import('../../src/services/community');
const moderation = await import('../../src/services/moderation');
const { makeProfile } = await import('./helpers');

const body = (words: string) => `<p>${words}</p>`;

describe('blog', () => {
  it('drafts are private, publishing is idempotent, slugs survive title changes, HTML is sanitized', async () => {
    const me = await makeProfile('writer');
    const other = await makeProfile('reader');
    const a = await blog.createArticle(me.id, {
      title: 'Gain Staging, Explained!',
      category: 'Mixing & mastering',
      bodyHtml:
        '<p onclick="x()">Keep peaks <strong>low</strong></p><script>alert(1)</script><a href="javascript:x()">bad</a>',
      tags: ['Mixing', '#gain', 'mixing'],
    });
    expect(a.slug).toMatch(/^gain-staging-explained-[0-9a-f]{6}$/);
    expect(a.bodyHtml).toBe('<p>Keep peaks <strong>low</strong></p>bad');
    expect(a.tags).toEqual(['mixing', 'gain']);

    await expect(blog.getArticle(null, a.slug)).rejects.toMatchObject({ status: 404 });
    await expect(blog.getArticle(other.id, a.slug)).rejects.toMatchObject({ status: 404 });
    await expect(
      blog.updateArticle(other.id, a.id, { title: 'x', category: 'Gear', bodyHtml: 'x' }),
    ).rejects.toMatchObject({ status: 404 });
    expect((await blog.getArticle(me.id, a.slug)).status).toBe('DRAFT');

    const [p1, p2] = await Promise.all([blog.publishArticle(me.id, a.id), blog.publishArticle(me.id, a.id)]);
    expect(p1.publishedAt?.getTime()).toBe(p2.publishedAt?.getTime());
    await blog.updateArticle(me.id, a.id, {
      title: 'Gain staging, revisited',
      category: 'Mixing & mastering',
      bodyHtml: body('new text'),
    });
    const pub = await blog.getArticle(null, a.slug);
    expect(pub.title).toBe('Gain staging, revisited');
    expect(pub.readingMinutes).toBe(1);

    const empty = await blog.createArticle(me.id, {
      title: 'Empty',
      category: 'Gear',
      bodyHtml: '<script>x</script>',
    });
    await expect(blog.publishArticle(me.id, empty.id)).rejects.toMatchObject({ status: 400 });
  });

  it('search covers the body text; related shares a category or a tag; suspended authors disappear', async () => {
    const me = await makeProfile('author');
    const tag = `t${Date.now()}`;
    const mk = async (title: string, category: 'Gear' | 'Songwriting', tags: string[], text: string) => {
      const a = await blog.createArticle(me.id, { title, category, tags, bodyHtml: body(text) });
      await blog.publishArticle(me.id, a.id);
      return a;
    };
    const main = await mk('Main', 'Gear', [tag], `the ${tag}word appears here`);
    const sameCat = await mk('Same category', 'Gear', [], 'x');
    const sameTag = await mk('Same tag', 'Songwriting', [tag], 'y');

    const found = await blog.listArticles(null, { q: `${tag}word` });
    expect(found.articles.map((a) => a.id)).toEqual([main.id]);
    expect((await blog.listArticles(null, { tag })).articles.map((a) => a.id).sort()).toEqual(
      [main.id, sameTag.id].sort(),
    );

    const related = await blog.relatedArticles(await blog.getArticle(null, main.slug), 50);
    const ids = related.map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining([sameCat.id, sameTag.id]));
    expect(ids).not.toContain(main.id);

    await db().profile.update({ where: { id: me.id }, data: { suspendedAt: new Date() } });
    expect((await blog.listArticles(null, { tag })).articles).toHaveLength(0);
  });

  it('reports reach moderation, and removing an article deletes it and tells the author', async () => {
    const author = await makeProfile('blogger');
    const reporter = await makeProfile('flagger');
    const mod = await makeProfile('mod');
    await db().profile.update({ where: { id: mod.id }, data: { role: 'MODERATOR' } });
    const a = await blog.createArticle(author.id, {
      title: 'Spam',
      category: 'Gear',
      bodyHtml: body('buy now'),
    });
    await blog.publishArticle(author.id, a.id);

    await community.report(reporter.id, {
      targetType: 'ARTICLE',
      targetId: a.id,
      reason: 'advertising spam',
    });
    const open = await moderation.listReports(mod.id, 'open');
    const r = open.find((x) => x.targetId === a.id)!;
    expect(r.target).toMatchObject({ owner: author.username, href: `/blog/${a.slug}` });

    await moderation.resolveReport(mod.id, { reportId: r.id, outcome: 'CONTENT_REMOVED' });
    expect(await db().article.findUnique({ where: { id: a.id } })).toBeNull();
    expect(
      await db().notification.count({
        where: { recipientId: author.id, type: 'moderation.removed', message: { contains: 'article' } },
      }),
    ).toBe(1);
  });
});
