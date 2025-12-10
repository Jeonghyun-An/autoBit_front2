// composables/useMarkdown.ts
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const LABELS = [
  "Definition/Classification",
  "Key Points/Conditions",
  "Related Clause/Evidence",
  "정의/분류",
  "주요 내용/조건",
  "관련 조항/근거",
];

function normalizeLists(src: string) {
  if (!src) return src;

  let s = src
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();

  // 1) LABELS 굵게 처리만 유지
  LABELS.forEach((lab) => {
    const re = new RegExp(`(^|\\n)\\s*${lab}\\s*:`, "g");
    s = s.replace(re, `$1**${lab}**:`);
  });

  // 2) 콜론 뒤에 불릿(-)이 붙어서 나오는 경우만 줄바꿈
  //    예) "내용:- 항목"
  s = s.replace(/:\s*-\s+/g, ":\n- ");

  // 3) 문장 끝 뒤에 불릿이 바로 따라붙는 경우만 줄바꿈
  //    예) "내용을 설명한다.- 항목"
  s = s.replace(/([.!?])\s*-\s+/g, "$1\n- ");

  // 4) bullet 중복 정리 (• → -)
  s = s.replace(/(?:^|\n)\s*•\s+/g, "\n- ");

  // 5) 줄 중간에 붙어버린 섹션 헤더 강제 개행
  //    예) "합니다. ### 2) 주요 내용" -> "합니다.\n\n### 2) 주요 내용"
  s = s.replace(/([^\n])\s+(###\s*\d+\)\s*[^\n]*)/g, "$1\n\n$2");

  // 6) 과도한 개행 제거
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  return s;
}

export function renderMarkdown(content: string) {
  if (!content) return "";
  const fixed = normalizeLists(content);
  return md.render(fixed);
}
