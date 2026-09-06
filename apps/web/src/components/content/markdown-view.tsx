import { renderMarkdown } from '../../lib/content/render-markdown';

export function MarkdownView({ source }: { source: string }) {
  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }}
    />
  );
}
