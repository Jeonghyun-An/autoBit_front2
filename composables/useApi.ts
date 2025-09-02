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

export function useApi() {
  const config = useRuntimeConfig();
  const API = (config.public.apiBase || "/llama").replace(/\/+$/, "");

  // --- helpers ---
  // encode each path segment but keep slashes in place
  const encodeObjectPath = (key: string) =>
    key.split("/").map(encodeURIComponent).join("/");

  function normalizeSources(raw: any[]): SourceMeta[] {
    return (raw || []).map((s: any, i: number) => {
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

  // --- API calls ---

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

  async function sendChat(
    _history: { role: "user" | "assistant"; content: string }[],
    query: string
  ) {
    const res = await fetch(`${API}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: query, top_k: 3 }),
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

  // ---- Files / Docs / Status ----

  // low-level: list raw object keys
  async function listFiles(prefix = "uploaded/") {
    const url = `${API}/files?prefix=${encodeURIComponent(prefix)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as { files: string[] };
    return data.files || [];
  }

  // high-level: build DocItem[] from /files (PDF only, hide internal keys)
  async function listDocs(): Promise<DocItem[]> {
    const files = await listFiles("uploaded/");
    const visible = files
      .filter(
        (k) =>
          !k.endsWith(".flag") &&
          !k.includes("/__hash__/") &&
          !k.includes("/__meta__/")
      )
      .filter((k) => k.toLowerCase().endsWith(".pdf"));

    return visible.map((k) => {
      const base = k.split("/").pop() || k;
      return {
        doc_id: base.replace(/\.pdf$/i, ""),
        title: base,
        object_key: k,
        url: undefined,
        uploaded_at: undefined,
      };
    });
  }

  // status: try /status; if missing, fall back to listDocs
  async function getStatus(): Promise<{
    has_data: boolean;
    doc_count?: number;
  }> {
    try {
      const res = await fetch(`${API}/status`);
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as { has_data: boolean; doc_count?: number };
    } catch {
      try {
        const docs = await listDocs();
        return { has_data: docs.length > 0, doc_count: docs.length };
      } catch {
        return { has_data: false, doc_count: 0 };
      }
    }
  }

  // presign: PDF 보기/다운로드 URL 생성 (필요 시 사용)
  async function getFileUrl(
    objectKey: string,
    minutes = 60,
    downloadName?: string
  ) {
    const q = new URLSearchParams({ minutes: String(minutes) });
    if (downloadName) q.set("download_name", downloadName);
    const pathKey = encodeObjectPath(objectKey);
    const res = await fetch(`${API}/file/${pathKey}?${q.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as { url: string };
  }

  // 프록시 스트리밍 URL (권장)
  function getViewUrl(objectKey: string, name?: string) {
    const pathKey = encodeObjectPath(objectKey);
    const q = name ? `?name=${encodeURIComponent(name)}` : "";
    return `${API}/view/${pathKey}${q}`;
  }

  function getDownloadUrl(objectKey: string, name?: string) {
    const pathKey = encodeObjectPath(objectKey);
    const q = name ? `?name=${encodeURIComponent(name)}` : "";
    return `${API}/download/${pathKey}${q}`;
  }

  return {
    uploadDocument,
    getJobProgress,
    sendChat,
    listFiles,
    listDocs,
    getStatus,
    getFileUrl, // optional (presigned)
    getViewUrl, // recommended for inline view
    getDownloadUrl, // recommended for downloads
  };
}
