// composables/useRagDraft.ts
// 관리자 화면의 "응답 설정" 슬라이더 값을 설정 패널과 채팅이 함께 쓰기 위한 공유 상태.
// 시험 모드가 켜져 있으면 이 값을 질문과 함께 /admin/ask 로 보내 그 요청에만 적용한다
// (서버 전체 설정은 "전체에 적용"을 눌러야 바뀐다).

export type RagDraft = {
  short: {
    top_k: number;
    max_tokens: number;
    temperature: number;
    context_budget: number;
  };
  long: {
    top_k: number;
    max_tokens: number;
    temperature: number;
    context_budget: number;
  };
  ultra: { top_k: number; max_tokens: number; temperature: number };
  search: { base_score_threshold: number; ultra_score_threshold: number };
};

export function defaultRagDraft(): RagDraft {
  return {
    short: { top_k: 3, max_tokens: 400, temperature: 0.0, context_budget: 1024 },
    long: { top_k: 10, max_tokens: 3096, temperature: 0.1, context_budget: 4096 },
    ultra: { top_k: 150, max_tokens: 5000, temperature: 0.1 },
    search: { base_score_threshold: 0.25, ultra_score_threshold: 0.25 },
  };
}

export function useRagDraft() {
  const draft = useState<RagDraft>("rag-draft", () => defaultRagDraft());
  // true: 슬라이더 값으로 이 질문에만 적용 / false: 서버에 적용된 설정으로 질문
  const testMode = useState<boolean>("rag-test-mode", () => true);

  /** 서버(/admin/rag-config, /admin/ask 의 overrides)가 받는 이름으로 변환 */
  function toOverrides() {
    const d = draft.value;
    return {
      short_top_k: d.short.top_k,
      short_max_tokens: d.short.max_tokens,
      short_temperature: d.short.temperature,
      short_context_budget: d.short.context_budget,
      long_top_k: d.long.top_k,
      long_max_tokens: d.long.max_tokens,
      long_temperature: d.long.temperature,
      long_context_budget: d.long.context_budget,
      ultra_top_k: d.ultra.top_k,
      ultra_max_tokens: d.ultra.max_tokens,
      ultra_temperature: d.ultra.temperature,
      base_score_threshold: d.search.base_score_threshold,
      ultra_score_threshold: d.search.ultra_score_threshold,
    };
  }

  return { draft, testMode, toOverrides };
}
