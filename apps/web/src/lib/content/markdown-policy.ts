import type rehypeSanitize from 'rehype-sanitize';

type MarkdownSchema = NonNullable<Parameters<typeof rehypeSanitize>[0]>;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
}

export const MARKDOWN_MAX_LENGTH = 100_000;

/**
 * Shared server/browser policy. Markdown cannot introduce raw HTML, embedded
 * media, executable URLs, event handlers, style, ids, or arbitrary classes.
 */
export const markdownPolicy: MarkdownSchema = deepFreeze({
  tagNames: [
    'p',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'ul',
    'ol',
    'li',
    'strong',
    'em',
    'del',
    'pre',
    'code',
    'a',
  ],
  attributes: {
    a: ['href', 'title'],
    ol: ['start'],
  },
  protocols: {
    href: ['https', 'http', 'mailto'],
  },
  clobberPrefix: 'markdown-',
});
