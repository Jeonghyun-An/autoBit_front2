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
  object_key?: string; // = pdf_key
  url?: string;
  uploaded_at?: string;
  // new
  pdf_key: string; // uploaded/xxx.pdf
  orig_key?: string; // uploaded/originals/xxx.docx (있을 경우)
};

export function useApi() {
  const config = useRuntimeConfig();
  const API = (config.public.apiBase || "/llama").replace(/\/+$/, "");

  // --- helpers ---
  const encodeObjectPath = (key: string) =>
    key.split("/").map(encodeURIComponent).join("/");

  const encodeQS = (v: string) => encodeURIComponent(v);

  // 다양한 확장자 제거용 (pdf, office, hwp/hwpx 등)
  const EXT_RE = /\.(pdf|docx?|pptx?|xlsx?|hwp|hwpx|txt)$/i;
  const basenameNoExt = (key: string) =>
    (key.split("/").pop() || "").replace(EXT_RE, "");

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

  // 내부 프록시 스트리밍 URL (권장)
  function getViewUrl(
    objectKey: string,
    name?: string,
    page?: number,
    origKey?: string
  ) {
    const pathKey = encodeObjectPath(objectKey);
    const qs = new URLSearchParams();
    if (name) qs.set("name", name);
    if (origKey) qs.set("orig", encodeObjectPath(origKey));
    const hash = page != null ? `#page=${page}` : "";
    const q = qs.toString();
    return `${API}/view/${pathKey}${q ? `?${q}` : ""}${hash}`;
  }
  function getDownloadUrl(objectKey: string, name?: string) {
    const pathKey = encodeObjectPath(objectKey);
    const q = name ? `?name=${encodeQS(name)}` : "";
    return `${API}/download/${pathKey}${q}`;
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

  // 업로드 후 즉시 pdf_key / orig_key까지 함께 반환해주는 편의 함수
  async function uploadAndResolve(
    file: File,
    mode: "skip" | "version" | "replace" = "version"
  ): Promise<{
    job_id: string;
    pdf_key: string;
    orig_key?: string;
    filename: string;
  }> {
    const resp = await uploadDocument(file, mode);
    const pdf_key = resp.minio_object;

    // 원본이 저장되어 있다면 uploaded/originals/<원본파일명> 일 것
    // 작은 규모 가정 → originals 전체를 받아서 매칭
    let orig_key: string | undefined;
    try {
      const originals = await listFiles("uploaded/originals/");
      const expect = `uploaded/originals/${file.name}`;
      // 정확 일치 우선
      if (originals.includes(expect)) {
        orig_key = expect;
      } else {
        // 베이스명으로 유사 매칭 (확장자 차이 등)
        const base = basenameNoExt(file.name);
        const cand = originals.find((k) => basenameNoExt(k) === base);
        if (cand) orig_key = cand;
      }
    } catch {
      // originals 리스트가 실패해도 앱 동작에는 영향 없음
    }
    return { job_id: resp.job_id, pdf_key, orig_key, filename: resp.filename };
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

  // high-level docs (PDF + ORIGINALS 매핑)
  async function listDocs(): Promise<DocItem[]> {
    const pdfs = (await listFiles("uploaded/")).filter((k) =>
      k.toLowerCase().endsWith(".pdf")
    );
    let originals: string[] = [];
    try {
      originals = await listFiles("uploaded/originals/");
    } catch {
      originals = [];
    }

    // base → orig_key
    const origMap = new Map<string, string>();
    for (const k of originals) {
      const base = basenameNoExt(k);
      if (base) origMap.set(base, k);
    }

    // uuid_ 접두 제거(보기명 예쁘게)
    const pretty = (fn: string) =>
      /^[0-9a-fA-F]{32}_/.test(fn) ? fn.slice(33) : fn;

    return pdfs.map((k) => {
      const baseWithExt = k.split("/").pop() || k;
      const base = baseWithExt.replace(/\.pdf$/i, "");
      const ok = origMap.get(base);
      const title = pretty(baseWithExt);
      return {
        doc_id: base,
        title,
        object_key: k, // backward-compat
        url: undefined,
        uploaded_at: undefined,
        pdf_key: k,
        orig_key: ok,
      };
    });
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

  // presign (옵션)
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

  // ---- doc_id → {pdf_key, orig_key} 매핑 캐시 ----
  let _docIndex: Map<
    string,
    { pdf_key: string; orig_key?: string; title?: string }
  > | null = null;
  async function ensureDocIndex() {
    if (_docIndex) return _docIndex;
    const docs = await listDocs();
    _docIndex = new Map(
      docs.map((d) => [
        d.doc_id,
        { pdf_key: d.pdf_key, orig_key: d.orig_key, title: d.title },
      ])
    );
    return _docIndex;
  }
  async function resolveObjectKeyByDocId(docId?: string) {
    if (!docId) return null;
    const idx = await ensureDocIndex();
    return idx.get(docId)?.pdf_key || null;
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

    // 🔗 근거 URL 채우기: /viewer?object=...&orig=...&name=...&page=...
    const index = await ensureDocIndex();
    sources = sources.map((s) => {
      if (!s.url && s.doc_id && index.has(s.doc_id)) {
        const info = index.get(s.doc_id)!;
        const pdfKey = info.pdf_key;
        const origKey = info.orig_key;
        const name = s.title || info.title || `${s.doc_id}.pdf`;

        const viewerRoute =
          `/viewer?object=${encodeObjectPath(pdfKey)}&name=${encodeQS(name)}` +
          (origKey ? `&orig=${encodeObjectPath(origKey)}` : "") +
          (s.page != null ? `&page=${s.page}` : "");

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

    // links
    getFileUrl, // presign (optional)
    getViewUrl, // proxy view
    getDownloadUrl, // proxy download

    // mapping helpers
    resolveObjectKeyByDocId,
  };
}
