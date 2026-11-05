import { describe, expect, it } from 'vitest';
import { postSchema, profileSchema, safeUrl, signUpSchema, usernameSchema } from './index';

describe('shared schemas', () => {
  it('normalises usernames', () => {
    expect(usernameSchema.parse('  Mike_99 ')).toBe('mike_99');
    expect(usernameSchema.safeParse('no spaces').success).toBe(false);
    expect(usernameSchema.safeParse('ab').success).toBe(false);
  });
  it('only allows http(s) links (XSS boundary)', () => {
    expect(safeUrl.safeParse('https://soundcloud.com/x').success).toBe(true);
    expect(safeUrl.safeParse('javascript:alert(1)').success).toBe(false);
    expect(safeUrl.safeParse('data:text/html,hi').success).toBe(false);
  });
  it('validates sign-up', () => {
    expect(
      signUpSchema.safeParse({ email: 'a@b.co', password: 'short', displayName: 'A', username: 'abc' })
        .success,
    ).toBe(false);
    expect(
      signUpSchema.parse({ email: 'A@B.co', password: 'longenough', displayName: 'A', username: 'abc' })
        .email,
    ).toBe('a@b.co');
  });
  it('rejects unsafe post links and defaults arrays', () => {
    expect(postSchema.safeParse({ title: 't', body: 'b', links: ['javascript:x'] }).success).toBe(false);
    expect(postSchema.parse({ title: 't', body: 'b' })).toMatchObject({
      tags: [],
      links: [],
      type: 'PROGRESS',
    });
  });
  it('turns empty optional profile fields into null', () => {
    expect(profileSchema.parse({ displayName: 'A', username: 'abc', website: '', bio: '' })).toMatchObject({
      website: null,
      bio: null,
    });
  });
});
