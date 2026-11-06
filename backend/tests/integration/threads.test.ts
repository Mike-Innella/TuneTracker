import { describe, expect, it, vi } from 'vitest';
import { db } from '@tunetracker/data';

vi.mock('../../src/storage', () => ({
  removeObjects: vi.fn(async () => {}),
  publicUrl: (p: string | null | undefined) => (p ? `public://${p}` : null),
  signedReadUrls: vi.fn(async (paths: string[]) => new Map(paths.map((p) => [p, `signed://${p}`]))),
  signedDownloadUrl: vi.fn(),
}));

const community = await import('../../src/services/community');
const tracks = await import('../../src/services/tracks');
const { makeProfile } = await import('./helpers');

const notes = (recipientId: string, type: string) =>
  db().notification.findMany({ where: { recipientId, type } });

async function publishedTrack(ownerId: string) {
  const a = await db().mediaAsset.create({
    data: {
      ownerId,
      kind: 'AUDIO',
      bucket: 'media',
      path: `${ownerId}/${Math.random()}.wav`,
      mimeType: 'audio/wav',
      sizeBytes: 9,
      verifiedAt: new Date(),
    },
  });
  const t = await tracks.createDraft(ownerId, { audioId: a.id });
  return tracks.publishTrack(ownerId, t.id);
}

describe('community threads, mentions and embeds', () => {
  it('replies stay one level deep, and the right people are notified once', async () => {
    const author = await makeProfile('poster');
    const first = await makeProfile('first');
    const second = await makeProfile('second');
    const post = await community.createPost(author.id, { title: 'Mix v2', body: 'thoughts?' });

    const top = await community.addComment(first.id, post.id, 'Kick is great');
    const reply = await community.addComment(second.id, post.id, 'Agree', top.id);
    // replying to a reply joins the same thread
    const nested = await community.addComment(author.id, post.id, 'Thanks both', reply.id);
    expect(reply.parentId).toBe(top.id);
    expect(nested.parentId).toBe(top.id);

    const { comments } = await community.getPost(null, post.id);
    expect(comments).toHaveLength(1);
    expect(comments[0]!.replies.map((r) => r.body)).toEqual(['Agree', 'Thanks both']);

    expect(await notes(first.id, 'comment.reply')).toHaveLength(1); // second replied to first
    expect(await notes(second.id, 'comment.reply')).toHaveLength(1); // author replied to second's reply
    expect(await notes(author.id, 'post.comment')).toHaveLength(2); // never for their own comment

    // a parent from another post is rejected
    const other = await community.createPost(author.id, { title: 'Other', body: 'x' });
    await expect(community.addComment(first.id, other.id, 'hi', top.id)).rejects.toMatchObject({
      status: 404,
    });

    // deleting the top-level comment removes its replies
    await community.deleteComment(first.id, top.id);
    expect(await db().postComment.count({ where: { postId: post.id } })).toBe(0);
  });

  it('mentions notify existing, active people once; edits only notify new names', async () => {
    const author = await makeProfile('writer');
    const ada = await makeProfile('ada');
    const bob = await makeProfile('bob');
    const banned = await makeProfile('banned');
    await db().profile.update({ where: { id: banned.id }, data: { suspendedAt: new Date() } });

    const post = await community.createPost(author.id, {
      title: 'Credits',
      body: `mixed by @${ada.username} @${ada.username}, thanks @${banned.username} @nobody_here @${author.username}`,
    });
    expect(await notes(ada.id, 'mention')).toHaveLength(1);
    expect(await notes(banned.id, 'mention')).toHaveLength(0);
    expect(await notes(author.id, 'mention')).toHaveLength(0);

    await community.updatePost(author.id, post.id, {
      title: 'Credits',
      body: `mixed by @${ada.username}, mastered by @${bob.username}`,
    });
    expect(await notes(ada.id, 'mention')).toHaveLength(1);
    expect(await notes(bob.id, 'mention')).toHaveLength(1);

    // a mention in a reply doesn't double up with the reply notification
    const c = await community.addComment(bob.id, post.id, 'nice');
    await community.addComment(ada.id, post.id, `@${bob.username} agreed`, c.id);
    expect(await notes(bob.id, 'comment.reply')).toHaveLength(1);
    expect(await notes(bob.id, 'mention')).toHaveLength(1); // only the post edit
  });

  it('posts embed only your own published tracks', async () => {
    const me = await makeProfile('embedder');
    const other = await makeProfile('someone');
    const mine = await publishedTrack(me.id);
    const theirs = await publishedTrack(other.id);
    await expect(
      community.createPost(me.id, { title: 'x', body: 'y', trackId: theirs.id }),
    ).rejects.toMatchObject({ status: 400 });
    const post = await community.createPost(me.id, {
      title: 'New single',
      body: 'out now',
      trackId: mine.id,
    });
    const { post: shown } = await community.getPost(null, post.id);
    expect(shown.track).toMatchObject({ id: mine.id, url: expect.stringMatching(/^signed:\/\//) });

    await tracks.unpublishTrack(me.id, mine.id);
    expect((await community.getPost(null, post.id)).post.track).toBeNull(); // drafts never leak through posts
  });
});
