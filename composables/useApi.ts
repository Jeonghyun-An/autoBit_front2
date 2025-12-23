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
  data_code?: string; // 예: "theme4"
  data_detail_code?: string; // 예: "theme4-1"
  data_sub_code?: string; // 예: "theme4-4-1"
};

export function useApi() {
  const config = useRuntimeConfig();
  const API = (config.public.apiBase || "/llama").replace(/\/+$/, "");
  //  문서 목록 캐시
  let _docsCache: { data: DocItem[]; timestamp: number } | null = null;
  const CACHE_TTL = 5 * 60 * 1000; // 5분
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

      // 섹션은 section 메타로만 보관 (title로 쓰지 않음)
      const section =
        s.section ?? s?.metadata?.section ?? s?.metadata?.title ?? undefined;

      return {
        id: String(s.id ?? i + 1),
        // title은 일단 비워두고, 아래 sendChat에서 docIndex로 채움
        title: undefined,
        doc_id: s.doc_id ?? s?.metadata?.doc_id,
        page: s.page ?? s.page_num ?? s?.metadata?.page,
        score: s.score ?? s.relevance ?? s.similarity,
        chunk_index: s.chunk_index ?? s.idx ?? s.index,
        snippet: cleaned,
        url: s.url ?? s.link ?? s.source_url,
        metadata: { ...(s.metadata ?? {}), section },
      };
    });
  }

  // 내부 프록시 스트리밍 URL (PDF 보기)

  function safePdfName(name: string) {
    const base = (name || "document.pdf").replace(/[\\/:*?"<>|]+/g, "_").trim();
    return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
  }

  function getViewUrl(
    objectKey: string,
    name?: string,
    page?: number,
    origKey?: string
  ) {
    // 1) 원하는 표시명 확정
    const pretty = safePdfName(
      name || objectKey.split("/").pop() || "document.pdf"
    );

    // 2) alias 라우트 사용: URL이 예쁜 파일명으로 끝나게
    const alias = encodeURIComponent(pretty);
    const src = encodeURIComponent(objectKey);
    let url = `${API}/view/alias/${alias}?src=${src}`;

    // (선택) 원본키도 전달하고 싶으면 qs에 orig 붙이기
    if (origKey) {
      url += `&orig=${encodeURIComponent(origKey)}`;
    }

    // 페이지 점프는 해시로 유지
    if (page != null) url += `#page=${page}`;

    return url;
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
    if (_docsCache) {
      const age = Date.now() - _docsCache.timestamp;
      if (age < CACHE_TTL) {
        console.log(
          "[CACHE] Using cached docs list (age: " +
            Math.round(age / 1000) +
            "s)"
        );
        return _docsCache.data;
      }
      console.log("[CACHE] Cache expired, fetching new data");
    }
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
          data_code?: string;
          data_detail_code?: string;
          data_sub_code?: string;
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
        data_code: d.data_code,
        data_detail_code: d.data_detail_code,
        data_sub_code: d.data_sub_code,
      })) as DocItem[];
    };
    try {
      const docs = await tryFetch(`/rag/docs`);
      _docsCache = {
        data: docs,
        timestamp: Date.now(),
      };
      console.log(`[CACHE] Cached ${docs.length} documents`);

      return docs;
    } catch {
      try {
        const docs = await tryFetch(`/docs`);
        _docsCache = {
          data: docs,
          timestamp: Date.now(),
        };

        return docs;
      } catch {
        /* 폴백 계속 진행 */
      }
    }
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

    const docs = files.map((k) => {
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
        data_code: undefined,
        data_detail_code: undefined,
        data_sub_code: undefined,
      } as DocItem;
    });
    _docsCache = {
      data: docs,
      timestamp: Date.now(),
    };
    return docs;
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
  /**
   * 문서 ID로 MinIO에 저장된 meta.json 조회
   * - 예: uploaded/__meta__/{docId}/meta.json
   */
  async function getMetaByDocId(docId: string) {
    try {
      // 🔹 API = config.public.apiBase (지금은 "/llama")
      const res = await fetch(`${API}/rag/meta/${encodeURIComponent(docId)}`);

      if (!res.ok) {
        console.warn(
          `[useApi] meta.json not found for docId=${docId} (status=${res.status})`
        );
        return null;
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.error(`[useApi] getMetaByDocId failed: ${err}`);
      return null;
    }
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
    history: { role: "user" | "assistant"; content: string }[],
    query: string,
    docIds?: string[],
    responseType: "short" | "long" | "ultra_long" = "short"
  ) {
    const actualResponseType: "short" | "long" =
      responseType === "ultra_long" ? "long" : responseType;

    const isLongContext = responseType === "ultra_long";
    const body: any = {
      question: query,
      top_k: 3,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      response_type: actualResponseType, // "short" | "long"
      long_context: isLongContext, // true | false
    };

    // 선택된 문서가 있으면 doc_ids 전달
    if (docIds && docIds.length > 0) {
      body.doc_ids = docIds;
    }
    console.log(
      `[API] sendChat: response_type=${responseType}, docIds=${
        docIds?.length || 0
      }`
    );

    const res = await fetch(`${API}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
      // 1) 제목 보정: meta.title > 인덱스 title > doc_id.pdf
      const info = s.doc_id ? idx.get(s.doc_id) : undefined;
      const metaTitle = s?.metadata?.title || s?.metadata?.doc_title;
      const fixedTitle =
        metaTitle || info?.title || (s.doc_id ? `${s.doc_id}.pdf` : undefined);

      // 2) URL 없으면 viewer 라우트 생성
      if (!s.url && s.doc_id && info?.pdf_key) {
        const pdfKey = info.pdf_key;
        const origKey = info.original_key;
        const nameForViewer = fixedTitle || `${s.doc_id}.pdf`;
        const qs = new URLSearchParams({ object: pdfKey, name: nameForViewer });
        if (origKey) qs.set("orig", origKey);
        if (s.page != null) qs.set("page", String(s.page));
        s.url = `/viewer?${qs.toString()}`;
      }

      return { ...s, title: fixedTitle };
    });

    return { answer, sources } as { answer: string; sources?: SourceMeta[] };
  }
  // doc 메타 조회 (pdf_key / original_key / original_name / title)
  async function getDocInfo(docId: string) {
    const idx = await ensureDocIndex();
    const it = idx.get(docId);
    if (!it) return null;
    return {
      pdf_key: it.pdf_key,
      original_key: it.original_key,
      original_name: it.original_name,
      title: it.title,
    };
  }

  // 문서별 청크 조회 (debug 엔드포인트 래핑)
  async function getDocChunks(
    docId: string,
    limit = 500,
    full = true, // true면 서버에서 자르지 않음
    maxChars?: number // false일 때 잘라낼 최대 길이
  ) {
    const qs = new URLSearchParams({
      doc_id: docId,
      limit: String(limit),
      full: full ? "true" : "false",
    });
    if (!full && maxChars != null) qs.set("max_chars", String(maxChars));

    const r = await fetch(`${API}/debug/milvus/by-doc?${qs.toString()}`);
    if (!r.ok) throw new Error(await r.text());
    const { items } = (await r.json()) as { items: any[] };
    return items || [];
  }

  async function getDocChunkCount(docId: string) {
    const r = await fetch(`${API}/doc/${encodeURIComponent(docId)}`);
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    return typeof j?.chunks === "number" ? j.chunks : null;
  }

  // ===== 카테고리 필터링 API =====
  async function listDocsByCode(filter: {
    code?: string;
    detail?: string;
    sub?: string;
  }): Promise<string[]> {
    const qs = new URLSearchParams();
    if (filter.code) qs.set("data_code", filter.code);
    if (filter.detail) qs.set("data_code_detail", filter.detail);
    if (filter.sub) qs.set("data_code_detail_sub", filter.sub);

    const res = await fetch(`${API}/rag/docs/by-code?${qs.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as { doc_ids: string[] };
    return data.doc_ids || [];
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

    //chunking debug
    getDocChunks,
    getDocInfo,
    getDocChunkCount,
    getMetaByDocId,

    // category filter
    listDocsByCode,
  };
}
