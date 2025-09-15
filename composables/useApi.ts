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
  // backward-compat
  object_key?: string; // = pdf_key (구버전 컴포넌트 호환용)
  url?: string;
  uploaded_at?: string;
  // new (서버 /docs 매핑 기준)
  pdf_key: string; // uploaded/xxx.pdf
  original_key?: string; // uploaded/originals/xxx.ext (있을 경우)
  original_name?: string; // 원본 파일명(예: .docx)
  is_pdf_original?: boolean; // 원본 자체가 pdf인지
};

export function useApi() {
  const config = useRuntimeConfig();
  const API = (config.public.apiBase || "/llama").replace(/\/+$/, "");

  // --- helpers ---
  // PATH 파라미터(슬래시 보존)용 인코딩
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

  // 내부 프록시 스트리밍 URL (PDF 보기)

  function getViewUrl(
    objectKey: string,
    name?: string,
    page?: number,
    origKey?: string
  ) {
    const pathKey = encodeObjectPath(objectKey);
    const qs = new URLSearchParams();
    if (name) qs.set("name", name);
    if (origKey) qs.set("orig", origKey); // ← 원본 키를 뷰어에 넘겨줌
    const hash = page != null ? `#page=${page}` : "";
    const q = qs.toString();
    return `${API}/view/${pathKey}${q ? `?${q}` : ""}${hash}`;
  }

  // 내부 프록시 다운로드 URL (원본 다운로드)
  function getDownloadUrl(objectKey: string, name?: string) {
    const pathKey = encodeObjectPath(objectKey);
    const qs = new URLSearchParams();
    if (name) qs.set("name", name);
    const q = qs.toString();
    return `${API}/download/${pathKey}${q ? `?${q}` : ""}`;
  }

  // 문서 목록: /docs 먼저, 실패 시 /rag/docs 폴백
  async function listDocs(): Promise<DocItem[]> {
    const tryFetch = async (path: string) => {
      const r = await fetch(`${API}${path}`);
      if (!r.ok) throw new Error(await r.text());
      const j = (await r.json()) as {
        docs: Array<{
          doc_id: string;
          title?: string;
          object_key: string;
          original_key?: string;
          original_name?: string;
          is_pdf_original?: boolean;
          uploaded_at?: string;
        }>;
      };
      return (j.docs || []).map((d) => ({
        doc_id: d.doc_id,
        title: d.title,
        object_key: d.object_key,
        url: undefined,
        uploaded_at: d.uploaded_at,
        pdf_key: d.object_key,
        original_key: d.original_key,
        original_name: d.original_name,
        is_pdf_original: d.is_pdf_original,
      })) as DocItem[];
    };

    try {
      return await tryFetch(`/rag/docs`);
    } catch {
      try {
        return await tryFetch(`/docs`);
      } catch {
        /* 폴백 계속 진행 */
      }
    }

    // ... (기존 /files 폴백 부분 그대로 유지) ...
    const r = await fetch(
      `${API}/files?prefix=${encodeURIComponent("uploaded/")}`
    );
    if (!r.ok) throw new Error(await r.text());
    const data = (await r.json()) as { files: string[] };
    const files = (data.files || [])
      .filter(
        (k) =>
          !k.endsWith(".flag") &&
          !k.includes("/__hash__/") &&
          !k.includes("/__meta__/") &&
          !k.startsWith("uploaded/originals/")
      )
      .filter((k) => k.toLowerCase().endsWith(".pdf"));

    const pretty = (fn: string) =>
      /^[0-9a-fA-F]{32}_/.test(fn) ? fn.slice(33) : fn;

    return files.map((k) => {
      const base = k.split("/").pop() || k;
      const doc_id = base.replace(/\.pdf$/i, "");
      return {
        doc_id,
        title: pretty(base),
        object_key: k,
        url: undefined,
        uploaded_at: undefined,
        pdf_key: k,
        original_key: undefined,
      } as DocItem;
    });
  }

  let _docIndex: Map<
    string,
    {
      pdf_key: string;
      original_key?: string;
      original_name?: string;
      title?: string;
    }
  > | null = null;

  async function ensureDocIndex() {
    if (_docIndex) return _docIndex;
    const docs = await listDocs();
    _docIndex = new Map(
      docs.map((d) => [
        d.doc_id,
        {
          pdf_key: d.pdf_key,
          original_key: d.original_key,
          original_name: d.original_name,
          title: d.title,
        },
      ])
    );
    return _docIndex;
  }

  async function resolveObjectKeyByDocId(docId?: string) {
    if (!docId) return null;
    const idx = await ensureDocIndex();
    return idx.get(docId)?.pdf_key || null;
  }

  async function resolveOriginalByDocId(docId?: string) {
    if (!docId) return null;
    const idx = await ensureDocIndex();
    const it = idx.get(docId);
    if (!it?.original_key) return null;
    return {
      key: it.original_key,
      name: it.original_name || it.title || `${docId}`,
    };
  }

  // --- low-level API ---
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
      minio_object: string; // PDF object
      indexed: string;
      job_id: string;
    }>;
  }

  // 업로드 후 편의: 원본키 추정까지 반환(서버 /docs 없이도 동작)
  async function uploadAndResolve(
    file: File,
    mode: "skip" | "version" | "replace" = "version"
  ): Promise<{
    job_id: string;
    pdf_key: string;
    original_key?: string;
    filename: string;
  }> {
    const resp = await uploadDocument(file, mode);
    const pdf_key = resp.minio_object;

    // 가벼운 추정: originals 목록에서 파일명/베이스명으로 매칭
    let original_key: string | undefined;
    try {
      const originals = await listFiles("uploaded/originals/");
      const expect = `uploaded/originals/${file.name}`;
      if (originals.includes(expect)) {
        original_key = expect;
      } else {
        const base = (file.name.split("/").pop() || "").replace(/\.[^.]+$/, "");
        const cand = originals.find(
          (k) => (k.split("/").pop() || "").replace(/\.[^.]+$/, "") === base
        );
        if (cand) original_key = cand;
      }
    } catch {
      /* noop */
    }
    return {
      job_id: resp.job_id,
      pdf_key,
      original_key,
      filename: resp.filename,
    };
  }

  async function getJobProgress(jobId: string) {
    const res = await fetch(`${API}/job/${encodeURIComponent(jobId)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{ status: string; progress: number }>;
  }

  // raw list (keys)
  async function listFiles(prefix = "uploaded/") {
    const url = `${API}/files?prefix=${encodeURIComponent(prefix)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as { files: string[] };
    return data.files || [];
  }

  // status
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

  // ---- chat ----
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
    let sources = normalizeSources(
      Array.isArray(data.sources)
        ? data.sources
        : Array.isArray(data.evidence)
        ? data.evidence
        : Array.isArray(data.contexts)
        ? data.contexts
        : []
    );

    // 근거 URL → /viewer?object=...&orig=...&name=...&page=...
    const idx = await ensureDocIndex();
    sources = sources.map((s) => {
      if (!s.url && s.doc_id && idx.has(s.doc_id)) {
        const info = idx.get(s.doc_id)!;
        const pdfKey = info.pdf_key;
        const origKey = info.original_key;
        const name = s.title || info.title || `${s.doc_id}.pdf`;

        const qs = new URLSearchParams({ object: pdfKey, name });
        if (origKey) qs.set("orig", origKey);
        if (s.page != null) qs.set("page", String(s.page));
        const viewerRoute = `/viewer?${qs.toString()}`;

        return { ...s, url: viewerRoute };
      }
      return s;
    });

    return { answer, sources } as { answer: string; sources?: SourceMeta[] };
  }

  return {
    // uploads
    uploadDocument,
    uploadAndResolve,

    // chat & progress
    getJobProgress,
    sendChat,

    // docs & files
    listFiles,
    listDocs,
    getStatus,

    // links (프록시)
    getViewUrl, // view proxy
    getDownloadUrl, // download proxy

    // mapping helpers
    resolveObjectKeyByDocId,
    resolveOriginalByDocId,
  };
}
