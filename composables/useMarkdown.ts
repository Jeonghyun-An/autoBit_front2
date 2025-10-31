// composables/useMarkdown.ts
import MarkdownIt from "markdown-it";

/**
 * 보안: html=false 로 XSS 차단, 링크 자동화/줄바꿈만 허용
 */
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

export function renderMarkdown(content: string) {
  if (!content) return "";
  return md.render(content);
}
