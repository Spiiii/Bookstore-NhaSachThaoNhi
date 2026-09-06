import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownView } from '../../../components/content/markdown-view';
import { MarkdownPreview } from '../../../components/content/markdown-preview.client';
import { renderMarkdown } from '../render-markdown';
import { MARKDOWN_MAX_LENGTH, markdownPolicy } from '../markdown-policy';
import { xssFixtures } from './fixtures';

describe('Shared Markdown view/preview policy', () => {
  it.each(xssFixtures)('sanitizes %s in both view and preview', (source) => {
    const view = renderToStaticMarkup(<MarkdownView source={source} />);
    expect(renderToStaticMarkup(<MarkdownPreview source={source} />)).toBe(view);
    expect(view).not.toMatch(/<(?:script|img|iframe|svg)\b|\bonerror=|href="(?:javascript|data):/i);
  });
  it('preserves supported formatting and safe links', () => {
    const html = renderMarkdown('# Title\n\n**bold** [link](https://example.test)\n\n- item');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('href="https://example.test"');
    expect(html).toContain('<li>item</li>');
  });
  it('allows relative links without admitting inline media', () => {
    const html = renderMarkdown('[news](/news/article) ![pixel](https://evil.test/pixel.png)');
    expect(html).toContain('href="/news/article"');
    expect(html).not.toContain('<img');
  });
  it('enforces the backend content limit before parsing', () => {
    expect(() => renderMarkdown('x'.repeat(MARKDOWN_MAX_LENGTH + 1))).toThrow(RangeError);
  });
  it('keeps the shared policy immutable', () => {
    expect(Object.isFrozen(markdownPolicy)).toBe(true);
    expect(Object.isFrozen(markdownPolicy.tagNames)).toBe(true);
    expect(Object.isFrozen(markdownPolicy.protocols)).toBe(true);
  });
});
