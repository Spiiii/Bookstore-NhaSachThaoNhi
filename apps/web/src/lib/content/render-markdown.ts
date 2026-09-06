import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { MARKDOWN_MAX_LENGTH, markdownPolicy } from './markdown-policy';

const renderer = unified()
  .use(remarkParse)
  // Raw HTML nodes are discarded before the HTML tree is created.
  .use(remarkRehype, { allowDangerousHtml: false })
  // Sanitization is the final tree transformation before serialization.
  .use(rehypeSanitize, markdownPolicy)
  .use(rehypeStringify)
  .freeze();

export function renderMarkdown(source: string): string {
  if (typeof source !== 'string') throw new TypeError('Markdown source must be a string.');
  if (source.length > MARKDOWN_MAX_LENGTH) {
    throw new RangeError(`Markdown exceeds the ${MARKDOWN_MAX_LENGTH} character limit.`);
  }

  return String(renderer.processSync(source));
}
