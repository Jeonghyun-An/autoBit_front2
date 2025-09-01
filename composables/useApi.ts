// composables/useApi.ts
export type SourceMeta = {
  id: string;
  title?: string;
  doc_id?: string;
  page?: number;
  score?: number;
  chunk_index?: number;
  snippet?: string;
  url?: string;
  metadata?: Record<string, any>;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  sources?: SourceMeta[];
};

export type DocItem = {
  doc_id: string;
  title?: string;
  object_key?: string;
  url?: string;
  uploaded_at?: string;
};

// 라우터에 맞춘 API들
export function useApi() {
  const config = useRuntimeConfig();
  const API = (config.public.apiBase || "/llama").replace(/\/+$/, "");

  async function uploadDocument(
    file: File,
    mode: "skip" | "version" | "replace" = "version"
  ) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API}/upload?mode=${mode}`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{
      filename: string;
      minio_object: string;
      indexed: string;
      job_id: string;
    }>;
  }

  async function getJobProgress(jobId: string) {
    const res = await fetch(`${API}/job/${encodeURIComponent(jobId)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ status: string; progress: number }>;
  }
  function normalizeSources(raw: any[]): SourceMeta[] {
    return (raw || []).map((s: any, i: number) => {
      // 스니펫 후보들 중 하나 고르고, META 프리앰블 제거
      const textCandidate =
        (typeof s.snippet === "string" && s.snippet) ||
        (typeof s.chunk === "string" && s.chunk) ||
        (typeof s.text === "string" && s.text) ||
        (typeof s.content === "string" && s.content) ||
        (typeof s?.metadata?.text === "string" && s.metadata.text) ||
        "";
      const cleaned = textCandidate.replace(/^META:.*?\n/, "");

      return {
        id: String(s.id ?? i + 1),
        title:
          s.title ?? s.section ?? s?.metadata?.title ?? s?.metadata?.section,
        doc_id: s.doc_id ?? s?.metadata?.doc_id,
        page: s.page ?? s.page_num ?? s?.metadata?.page,
        score: s.score ?? s.relevance ?? s.similarity,
        chunk_index: s.chunk_index ?? s.idx ?? s.index,
        snippet: cleaned,
        url: s.url ?? s.link ?? s.source_url,
        metadata: s.metadata ?? { section: s.section },
      };
    });
  }
  async function sendChat(
    _history: { role: "user" | "assistant"; content: string }[],
    query: string
  ) {
    // 라우터 AskReq: { question, model_name?, top_k? }
    const res = await fetch(`${API}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: query, top_k: 3 }), // model_name은 서버 기본값 사용
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const answer = data.answer ?? data.output ?? data.result ?? "";
    const rawSources = Array.isArray(data.sources)
      ? data.sources
      : Array.isArray(data.evidence)
      ? data.evidence
      : Array.isArray(data.contexts)
      ? data.contexts
      : [];

    const sources = normalizeSources(rawSources);
    return { answer, sources } as { answer: string; sources?: SourceMeta[] };
  }

  // ===== 새로 추가: 파일/상태 조회 =====

  // MinIO의 uploaded/ 아래 파일 목록 -> object_name 문자열 배열
  async function listFiles(prefix = "uploaded/") {
    const url = `${API}/files?prefix=${encodeURIComponent(prefix)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as { files: string[] };
    return data.files || [];
  }

  // 특정 object_name의 presigned URL (GET)
  async function getFileUrl(
    objectName: string,
    minutes = 60,
    downloadName?: string
  ) {
    const q = new URLSearchParams({ minutes: String(minutes) });
    if (downloadName) q.set("download_name", downloadName);
    const url = `${API}/file/${encodeURIComponent(objectName)}?${q.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as { url: string };
  }

  return { uploadDocument, getJobProgress, sendChat, listFiles, getFileUrl };
}
