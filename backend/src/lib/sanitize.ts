import sanitize from 'sanitize-html';

/**
 * Article HTML allowlist: exactly what the editor can produce. Anything else — scripts, styles,
 * event handlers, iframes, images, javascript: links — is removed, never escaped into the page.
 */
const OPTIONS: sanitize.IOptions = {
  allowedTags: [
    'p',
    'h2',
    'h3',
    'strong',
    'em',
    'u',
    's',
    'code',
    'pre',
    'blockquote',
    'ul',
    'ol',
    'li',
    'hr',
    'br',
    'a',
  ],
  allowedAttributes: { a: ['href', 'rel', 'target'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    // the page owns the h1; editor headings never compete with it
    h1: 'h2',
    // runs before attribute filtering: author-supplied rel/target are always replaced; a link
    // that isn't http(s)/mailto becomes a disallowed tag, which is unwrapped (its text stays)
    a: (tagName, attribs): sanitize.Tag =>
      /^(https?:\/\/|mailto:)/i.test(attribs.href?.trim() ?? '')
        ? {
            tagName,
            attribs: { href: attribs.href!.trim(), rel: 'nofollow noopener noreferrer', target: '_blank' },
          }
        : { tagName: 'unsafe-link', attribs: {} },
  },
};

export const sanitizeArticleHtml = (html: string) => sanitize(html, OPTIONS).trim();

/** Plain text for search and excerpts: no tags, collapsed whitespace. */
export function htmlToText(html: string) {
  return sanitize(html.replace(/<\/(p|h2|h3|li|blockquote|pre)>/g, '$& '), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
