import { describe, expect, it } from 'vitest';
import { extractMentions, splitMentions } from './mentions';

describe('mentions', () => {
  it('finds distinct usernames and ignores emails and too-short handles', () => {
    expect(extractMentions('thanks @Ada_L and @bob! cc @ada_l, mail me at x@studio.com, @no')).toEqual([
      'ada_l',
      'bob',
    ]);
    expect(extractMentions('@start of line')).toEqual(['start']);
    expect(extractMentions('@@double @trailing_dot.')).toEqual(['trailing_dot']);
  });

  it('caps the number of mentions', () => {
    const text = Array.from({ length: 20 }, (_, i) => `@user${i}`).join(' ');
    expect(extractMentions(text)).toHaveLength(10);
  });

  it('splits text around mentions without losing characters', () => {
    const text = 'mix by @ada, master by @Bob.';
    const parts = splitMentions(text);
    expect(parts).toEqual([
      { text: 'mix by ' },
      { mention: 'ada' },
      { text: ', master by ' },
      { mention: 'bob' },
      { text: '.' },
    ]);
    expect(
      parts
        .map((p) => ('text' in p ? p.text : `@${p.mention}`))
        .join('')
        .toLowerCase(),
    ).toBe(text.toLowerCase());
  });
});
