'use client';
import { MarkdownView } from './markdown-view';

export function MarkdownPreview({ source }: { source: string }) {
  return <MarkdownView source={source} />;
}
