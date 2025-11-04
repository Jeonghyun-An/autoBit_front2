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

  // 0) 라벨 굵게
  LABELS.forEach((lab) => {
    const re = new RegExp(`(^|\\n)\\s*${lab}\\s*:`, "g");
    s = s.replace(re, (_m, p1) => `${p1}**${lab}**:`);
  });

  //   // 1) "1) 2) 3)" → 번호 목록으로
  //   s = s.replace(/(?:^|\n)(.*?)\s*(\d+[\)\.]\s+[^]+)$/m, (_m, head, tail) => {
  //     const items = tail
  //       .split(/\s*(?=\d+[\)\.]\s+)/g)
  //       .filter(Boolean)
  //       .map((t: string) =>
  //         t.replace(/^(\d+)[\)\.]\s+/, (_m2: any, n: any) => `${n}. `).trim()
  //       );
  //     const listBlock = items.length > 1 ? `\n\n${items.join("\n")}` : ` ${tail}`;
  //     return `${head.trim()}${listBlock}`;
  //   });
  //   s = s.replace(/\/\n(\d+)\.\s/g, "/$1. ");

  // 2️⃣ 콜론(:) 뒤에 바로 이어지는 불릿(공백 유무 상관없음)을 줄바꿈 리스트로
  //     예) "include:- A" → "include:\n\n- A"
  //         "내용: - 항목A" → "내용:\n\n- 항목A"
  s = s.replace(/[:：]\s*[-–]\s*(?=[A-Za-z0-9가-힣\[])/g, ":\n\n- ");

  // 3) 문장 끝(영/한 문장부호) 뒤 인라인 불릿을 줄바꿈 불릿으로
  s = s.replace(/([.!?;。？！；])\s*[-–]\s+(?=[A-Za-z0-9가-힣\[])/g, "$1\n- ");

  // 4) 한 줄에 여러 불릿이 붙어있는 경우 전부 분리
  s = s.replace(/(^|\n)\s*[-–]\s+[^\n]*?(?:\s+[-–]\s+[^\n]+)+/g, (m) => {
    return m
      .replace(/\s+[-–]\s+(?=[A-Za-z0-9가-힣\[])/g, "\n- ")
      .replace(/^\s*[-–]\s+/, "- ");
  });

  // 4.5)  라인 단위 보강 패스 (붙은 불릿 100% 분리)
  s = s
    .split("\n")
    .flatMap((line) => {
      if (/^\s*-\s+/.test(line) && /\s-\s+[A-Za-z0-9가-힣\[]/.test(line)) {
        return line
          .replace(/\s-\s+(?=[A-Za-z0-9가-힣\[])/g, "\n- ")
          .split("\n");
      }
      return [line];
    })
    .join("\n");

  // 5) '• ' 불릿 정규화
  s = s.replace(/(?:^|\n)\s*•\s+/g, "\n- ");

  // 6) 목록 앞에 빈 줄 보장 (문단→목록 전환 시)
  s = s.replace(/([^\/\n])\n(\d+\. |- )/g, "$1\n\n$2");

  // 7) 공백/개행 정리
  s = s.replace(/[ \t]{2,}/g, " ");
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  return s;
}

export function renderMarkdown(content: string) {
  if (!content) return "";
  const fixed = normalizeLists(content);
  return md.render(fixed);
}
