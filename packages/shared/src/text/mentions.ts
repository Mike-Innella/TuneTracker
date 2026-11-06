/**
 * @username mentions, matching usernameSchema (3–30 of a-z, 0-9, _). An @ glued to a word
 * (an email address like a@b.com) is not a mention.
 */
export const MENTION_RE = /(^|[^\w@])@([a-z0-9_]{3,30})(?![\w])/gi;

/** Distinct, lowercased usernames mentioned in `text`, first `max` only (notification spam cap). */
export function extractMentions(text: string, max = 10): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(MENTION_RE)) {
    out.add(m[2]!.toLowerCase());
    if (out.size >= max) break;
  }
  return [...out];
}

/** Splits text into plain runs and mentions, for rendering links. */
export function splitMentions(text: string): ({ text: string } | { mention: string })[] {
  const parts: ({ text: string } | { mention: string })[] = [];
  let last = 0;
  for (const m of text.matchAll(MENTION_RE)) {
    const start = m.index! + m[1]!.length;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ mention: m[2]!.toLowerCase() });
    last = start + 1 + m[2]!.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
