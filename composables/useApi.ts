export type SourceMeta = {
  chunk_index: null;
  id: string;
  title?: string;
  doc_id?: string;
  page?: number;
  score?: number;
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

export function useApi() {
  const config = useRuntimeConfig();
  const API = (config.public.apiBase || "/llama").replace(/\/+$/, "");
  console.log("[useApi] API base =", API);
  async function uploadDocument(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API}/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text());
    // llama_router 업로드 응답 스키마 맞춤
    return res.json() as Promise<{
      filename: string;
      minio_object: string;
      indexed: string;
      job_id: string;
    }>;
  }

  async function getJobProgress(jobId: string) {
    // 라우터는 /job/{job_id} 입니다. (/jobs/{id} 아님)
    const res = await fetch(`${API}/job/${jobId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ status: string; progress: number }>;
  }

  async function sendChat(
    _history: { role: "user" | "assistant"; content: string }[],
    query: string
  ) {
    // 백엔드 질의 엔드포인트는 /ask
    const res = await fetch(`${API}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 필요 시 모델명/탑K는 환경에 맞게 조정
      body: JSON.stringify({
        question: query,
        model_name: "llama-3",
        top_k: 3,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as { answer: string; sources?: any[] };

    // 서버 sources → 프론트 SourceMeta로 매핑
    // 서버는 id/doc_id/page/section/chunk/score 필드를 내려줍니다. :contentReference[oaicite:5]{index=5}
    const sources: SourceMeta[] = (data.sources || []).map((s, idx) => ({
      chunk_index: null,
      id: String(s.id ?? idx + 1),
      title: s.section || undefined,
      doc_id: s.doc_id,
      page: s.page,
      score: s.score,
      snippet: String(s.chunk || "").replace(/^META:.*?\n/, ""), // META 라인 제거
    }));

    return { answer: data.answer, sources };
  }

  // (옵션) SSE로 진행상태 받기
  function streamJob(jobId: string, onUpdate: (s: any) => void) {
    const es = new EventSource(`${API}/job/${jobId}/stream`); // :contentReference[oaicite:6]{index=6}
    es.onmessage = (e) => {
      try {
        onUpdate(JSON.parse(e.data));
      } catch {}
    };
    es.onerror = () => es.close();
    return () => es.close();
  }

  return { uploadDocument, getJobProgress, sendChat, streamJob };
}
