import { describe, expect, it } from 'vitest';
import { htmlToText, sanitizeArticleHtml } from '../../src/lib/sanitize';

describe('article sanitizer', () => {
  it('keeps the editor formatting', () => {
    const html =
      '<h2>Mixing</h2><p><strong>Low</strong> <em>end</em> <u>first</u> <s>later</s> <code>-6dB</code></p><ul><li>one</li></ul><ol><li>two</li></ol><blockquote><p>q</p></blockquote><pre><code>x</code></pre><hr>';
    expect(sanitizeArticleHtml(html)).toBe(html.replace('<hr>', '<hr />'));
  });

  it('removes scripts, handlers, styles, frames and images', () => {
    const out = sanitizeArticleHtml(
      '<p onclick="steal()" style="color:red">hi</p><script>alert(1)</script><iframe src="https://x"></iframe><img src=x onerror=alert(1)><style>p{}</style>',
    );
    expect(out).toBe('<p>hi</p>');
  });

  it('only allows safe links and forces rel/target', () => {
    expect(
      sanitizeArticleHtml('<a href="https://ex.com" rel="opener" target="_self" onclick="x()">site</a>'),
    ).toBe('<a href="https://ex.com" rel="nofollow noopener noreferrer" target="_blank">site</a>');
    for (const bad of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'data:text/html,<b>x</b>',
      '//evil.com',
    ]) {
      expect(sanitizeArticleHtml(`<a href="${bad}">click</a>`)).toBe('click');
    }
    expect(sanitizeArticleHtml('<a href="mailto:hi@ex.com">mail</a>')).toContain('href="mailto:hi@ex.com"');
  });

  it('demotes h1 so the page keeps a single h1', () => {
    expect(sanitizeArticleHtml('<h1>Title</h1>')).toBe('<h2>Title</h2>');
  });

  it('extracts searchable text', () => {
    expect(
      htmlToText('<h2>Gain</h2><p>Keep&nbsp;it <strong>low</strong></p><ul><li>a</li><li>b</li></ul>'),
    ).toBe('Gain Keep it low a b');
  });
});
