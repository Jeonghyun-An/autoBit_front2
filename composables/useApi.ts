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

type UploadResp =
  | { doc_id?: string; job_id?: string; task_id?: string; id?: string }
  | Record<string, any>;

type JobResp =
  | { status?: string; progress?: number; percent?: number; state?: string }
  | { progress?: { percent?: number; value?: number } }
  | Record<string, any>;

type ChatResp =
  | { answer: string; sources?: SourceMeta[] }
  | Record<string, any>;

function pick<T extends object, K extends string>(obj: T, keys: K[]): any {
  for (const k of keys) if (k in (obj as any)) return (obj as any)[k];
  return undefined;
}

export function useApi() {
  const config = useRuntimeConfig();
  const API = (config.public.apiBase || "").replace(/\/$/, "");

  // llama_router 경로가 다를 수 있어 환경변수로 오버라이드 가능하게 처리
  // 예) .env에
  // NUXT_PUBLIC_UPLOAD_PATH=/upload_document
  // NUXT_PUBLIC_JOB_PATH=/job
  // NUXT_PUBLIC_CHAT_PATH=/rag/chat
  const UPLOAD_PATH = (config.public as any).uploadPath || "/upload";
  const JOB_PATH = (config.public as any).jobPath || "/jobs";
  const CHAT_PATH = (config.public as any).chatPath || "/chat";

  // 어떤 서버는 "file"이 아닌 "document" 필드명을 요구할 수 있어 함께 전송
  async function uploadDocument(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("document", file); // 백엔드가 document를 기대하는 경우 대비
    // 필요 시 파일명/메타 부가 파라미터도 여기서 form.append(...) 추가

    const url = `${API}${UPLOAD_PATH.startsWith("/") ? "" : "/"}${UPLOAD_PATH}`;
    const res = await fetch(url, { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text());

    const data = (await res.json()) as UploadResp;

    // job id 키 정규화
    const job_id =
      pick(data, ["job_id", "task_id", "id"]) ??
      (data as any)?.job?.id ??
      (data as any)?.task?.id;

    const doc_id =
      pick(data, ["doc_id"]) ??
      (data as any)?.document_id ??
      (data as any)?.doc?.id;

    if (!job_id) {
      // 색인을 동기로 처리하는 서버일 수 있으니 job이 없으면 100%로 간주하도록 프론트에서 처리하게 해도 됨
      console.warn("uploadDocument: job id not found in response", data);
    }
    return { doc_id, job_id } as { doc_id?: string; job_id?: string };
  }

  async function getJobProgress(jobId: string) {
    // 어떤 서버는 /job/{id} 또는 /jobs/{id}/progress 를 쓰기도 함
    // 기본: /jobs/{id}
    let url = `${API}${
      JOB_PATH.startsWith("/") ? "" : "/"
    }${JOB_PATH}/${encodeURIComponent(jobId)}`;
    let res = await fetch(url);
    if (!res.ok) {
      // fallback: /jobs/{id}/progress
      const alt = `${url}/progress`;
      res = await fetch(alt);
      if (!res.ok) throw new Error(await res.text());
    }
    const data = (await res.json()) as JobResp;

    // 진행률 정규화
    let progress =
      typeof (data as any).progress === "number"
        ? (data as any).progress
        : (data as any).percent;

    if (progress == null && typeof (data as any).progress === "object") {
      const p = (data as any).progress;
      progress = p?.percent ?? p?.value;
    }
    if (progress == null) progress = 0;

    const status = (data as any).status ?? (data as any).state ?? "running";
    // 일부 서버는 1.0(=100%)로 줄 수도 있어 보정
    if (progress > 1 && progress <= 100) {
      // already percentage
    } else if (progress <= 1) {
      progress = Math.round(progress * 100);
    }
    progress = Math.max(0, Math.min(100, Math.round(progress)));

    return { status, progress };
  }

  async function sendChat(
    history: { role: "user" | "assistant"; content: string }[],
    query: string
  ) {
    const url = `${API}${CHAT_PATH.startsWith("/") ? "" : "/"}${CHAT_PATH}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, query }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as ChatResp;

    // 다양한 키 대응 (e.g. output, result, message 등)
    const answer =
      (data as any).answer ??
      (data as any).output ??
      (data as any).result ??
      (data as any).message ??
      "";

    const sources =
      (data as any).sources ??
      (data as any).evidence ??
      (data as any).contexts ??
      [];

    return { answer, sources } as { answer: string; sources?: SourceMeta[] };
  }

  return { uploadDocument, getJobProgress, sendChat };
}
