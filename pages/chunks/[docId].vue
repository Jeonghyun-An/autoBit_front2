<template>
  <div class="h-screen w-full bg-zinc-950 text-zinc-100 flex">
    <div class="flex-1 min-h-0 max-w-6xl mx-auto flex flex-col">
      <!-- Header -->
      <div
        class="px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950/80 backdrop-blur z-10"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="text-lg font-semibold break-all">
              {{ title || docId }}
            </div>
            <div
              class="flex justify-start items-baseline pt-1 text-xs text-zinc-400"
            >
              <div v-if="totalChunks != null">
                <span class="text-zinc-200">{{ chunks.length }}</span>
                <span> / {{ totalChunks }}</span>
              </div>
              <span v-else-if="chunks.length" class="ml-3">
                총 {{ chunks.length }}개 청크 로드됨
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <NuxtLink
              to="/"
              class="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs inline-flex items-center gap-1 whitespace-nowrap"
            >
              <Icon name="ic:twotone-arrow-back" class="w-4 h-4" />돌아가기
            </NuxtLink>

            <button
              v-if="pdfKey"
              type="button"
              class="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs inline-flex items-center gap-1 whitespace-nowrap"
              @click="openPdf()"
              title="변환된 PDF 뷰어 열기"
            >
              <Icon
                name="material-symbols:picture-as-pdf-rounded"
                class="w-4 h-4"
              />
              PDF 열기
            </button>

            <button
              v-if="origKey"
              type="button"
              class="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs inline-flex items-center gap-1 whitespace-nowrap"
              @click="downloadOriginal()"
              title="원본 파일 다운로드"
            >
              <Icon name="material-symbols:download-rounded" class="w-4 h-4" />
              원본 다운로드
            </button>
          </div>
        </div>

        <!-- Controls -->
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <input
            v-model="q"
            type="text"
            placeholder="청크 내에서 검색..."
            class="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm w-72"
          />
          <select
            v-model="sortKey"
            class="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm"
          >
            <option value="page">페이지순</option>
            <option value="idx">청크 인덱스</option>
          </select>
          <label class="text-sm text-zinc-400 inline-flex items-center gap-2">
            <input type="checkbox" v-model="hideMeta" class="accent-zinc-300" />
            META 라인 숨기기
          </label>
          <button
            type="button"
            class="ml-auto px-3 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm inline-flex items-center gap-1"
            @click="reload()"
            title="새로고침"
          >
            <Icon name="mynaui:refresh-alt" class="w-4 h-4"></Icon>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-zinc">
        <div
          v-if="loading"
          class="text-sm text-zinc-400 flex justify-center items-center py-10"
        >
          <Icon name="line-md:loading-twotone-loop" class="w-8 h-8" />
        </div>
        <div v-else-if="error" class="text-sm text-red-400">{{ error }}</div>
        <div v-else-if="!visibleChunks.length" class="text-sm text-zinc-400">
          표시할 청크가 없습니다.
        </div>

        <!-- ✅ Chunk list - 수정된 레이아웃 -->
        <div
          v-for="(c, i) in visibleChunks"
          :key="c.id || `${c.doc_id}-${c.page}-${i}`"
          class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 w-full"
        >
          <!-- ✅ 메타 정보와 버튼을 분리하여 항상 오른쪽 정렬 유지 -->
          <div class="flex items-start justify-between gap-3 w-full mb-2">
            <!-- 왼쪽: 메타 정보 (hideMeta일 때 투명하게 유지하여 공간 확보) -->
            <div
              class="text-xs text-zinc-400 flex flex-wrap items-center gap-3 min-h-[1.5rem]"
              :class="{ 'opacity-0': hideMeta }"
            >
              <span v-if="c.page != null" class="whitespace-nowrap">
                p. {{ c.page }}
              </span>
              <span v-if="c.chunk_index != null" class="whitespace-nowrap">
                chunk #{{ c.chunk_index }}
              </span>
              <div
                v-if="shouldShowSection(c)"
                class="text-xs text-zinc-400 whitespace-pre-wrap break-words"
              >
                section: {{ c.section }}
              </div>
            </div>

            <!-- 오른쪽: 버튼 (항상 표시) -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                v-if="pdfKey"
                type="button"
                class="text-xs px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 whitespace-nowrap"
                @click="openPdf(c.page)"
                title="해당 페이지로 열기"
              >
                페이지 열기
              </button>
              <button
                type="button"
                class="text-xs px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700"
                @click="copy(c)"
                title="클립보드 복사"
              >
                <Icon
                  v-if="isCopied(c)"
                  name="material-symbols:check-small-rounded"
                  class="w-3.5 h-3.5"
                />
                <Icon
                  v-else
                  name="material-symbols:content-copy-outline"
                  class="w-3.5 h-3.5"
                />
              </button>
            </div>
          </div>

          <!-- 본문 -->
          <div class="text-sm whitespace-pre-wrap leading-6">
            {{ renderBody(c) }}
          </div>
        </div>

        <div v-if="canLoadMore" class="pt-2">
          <button
            class="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm"
            @click="loadMore()"
          >
            더 불러오기 ({{ limit + step }}개까지)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useApi } from "@/composables/useApi";

type ChunkItem = {
  id?: string | number;
  doc_id: string;
  page?: number;
  section?: string;
  chunk?: string;
  chunk_index?: number;
  score?: number;
};

const route = useRoute();
const docId = String(route.params.docId || "");

const {
  getDocInfo,
  getDocChunks,
  getViewUrl,
  getDownloadUrl,
  getDocChunkCount,
} = useApi();

const title = ref<string>("");
const pdfKey = ref<string>("");
const origKey = ref<string | undefined>();
const origName = ref<string | undefined>();

const chunks = ref<ChunkItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const q = ref("");
const hideMeta = ref(false);
const sortKey = ref<"page" | "idx">("page");

const limit = ref(300);
const step = 200;

const canLoadMore = computed(() => chunks.value.length >= limit.value);

// -------- 클립보드 복사 --------
async function copyTextSafe(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
const copiedChunks = ref<Set<string>>(new Set());
function getChunkKey(c: ChunkItem): string {
  return `${c.doc_id}:${c.page ?? "x"}:${c.chunk_index ?? "x"}:${c.id ?? "x"}`;
}
const isCopied = computed(() => {
  return (chunk: ChunkItem) => copiedChunks.value.has(getChunkKey(chunk));
});
async function copy(c: ChunkItem) {
  const t = stripMeta(c.chunk || "");
  if (!t) return;
  const ok = await copyTextSafe(t);
  if (!ok) {
    alert("클립보드 복사 실패. 브라우저 권한/HTTPS 여부를 확인해주세요.");
    return;
  }
  const key = getChunkKey(c);
  copiedChunks.value.add(key);
  setTimeout(() => copiedChunks.value.delete(key), 2000);
}

// -------- 카운트 로드 --------
const totalChunks = ref<number | null>(null);
async function loadCount() {
  try {
    totalChunks.value = await getDocChunkCount(docId);
  } catch {
    totalChunks.value = null;
  }
}

// -------- 마운트 --------
onMounted(async () => {
  await Promise.all([loadMeta(), loadCount(), loadChunks()]);
});
watch(
  () => route.params.docId,
  async () => {
    totalChunks.value = null;
    chunks.value = [];
    await Promise.all([loadMeta(), loadCount(), loadChunks()]);
  }
);

// -------- 유틸 --------
function stripMeta(t?: string) {
  const s = t || "";
  // 본문 META 라인은 항상 제거(요구사항 유지)
  if (s.startsWith("META:")) {
    const nl = s.indexOf("\n");
    return nl >= 0 ? s.slice(nl + 1) : "";
  }
  return s;
}
function escapeRegExp(x: string) {
  return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function collapseConsecutiveDuplicates(text: string) {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (const l of lines) {
    const t = l.trim();
    const last = out.length > 0 ? out[out.length - 1] : undefined;
    if (!last || last.trim() !== t) out.push(l);
  }
  return out.join("\n");
}

// 섹션과 겹치는 본문 첫머리 제거(표시용)
function removeSectionEcho(section: string, body: string) {
  const sec = (section || "").trim();
  if (!sec) return body;
  let b = body.trimStart();
  const pats = [
    new RegExp("^" + escapeRegExp(sec) + "\\s*\\n?", "u"),
    new RegExp("^\\[[-+•*\\s]*" + escapeRegExp(sec) + "\\s*\\]\\s*\\n?", "u"),
    new RegExp(
      "^(section|섹션)\\s*[:：]\\s*" + escapeRegExp(sec) + "\\s*\\n?",
      "iu"
    ),
  ];
  for (const p of pats) b = b.replace(p, "");
  return b;
}

// 본문 렌더(요구사항 유지)
function renderBody(c: { section?: string; chunk?: string }) {
  let body = stripMeta(c.chunk || "");
  // body = removeSectionEcho(c.section || "", body);
  body = collapseConsecutiveDuplicates(body);
  return body;
}

// 섹션이 본문 "첫머리"에 사실상 겹치는지 판단(표시용 판단)
function sectionAppearsAtStart(sec: string, body: string) {
  const s = (sec || "").trim();
  if (!s) return false;
  const raw = body.trimStart();
  const firstLine = (raw.split(/\r?\n/)[0] || "").trim();

  // 첫 줄이 동일하거나, 대괄호/접두어 형태로 섹션과 같으면 중복으로 간주
  if (firstLine === s) return true;
  const pats = [
    new RegExp("^\\[[-+•*\\s]*" + escapeRegExp(s) + "\\s*\\]$", "u"),
    new RegExp("^(section|섹션)\\s*[:：]\\s*" + escapeRegExp(s) + "$", "iu"),
  ];
  return pats.some((p) => p.test(firstLine));
}

// 메타 섹션을 표시할지 최종 판단
function shouldShowSection(c: { section?: string; chunk?: string }) {
  if (!c.section) return false; // 섹션 없음
  // 메타 라인은 외부에서 v-show="!hideMeta"로 통제됨 (여기선 중복만 판단)
  const rawBody = stripMeta(c.chunk || "");
  return !sectionAppearsAtStart(c.section, rawBody);
}

// -------- 데이터 로드 --------
async function loadMeta() {
  const info = await getDocInfo(docId);
  if (info) {
    title.value = info.title || docId;
    pdfKey.value = info.pdf_key;
    origKey.value = info.original_key;
    origName.value = info.original_name;
  } else {
    title.value = docId;
  }
}
async function loadChunks() {
  loading.value = true;
  error.value = null;
  try {
    const items = await getDocChunks(docId, limit.value, true);
    chunks.value = (Array.isArray(items) ? items : []).map(
      (it: any, i: number) => ({
        id: it.id ?? i,
        doc_id: it.doc_id,
        page: it.page ?? it.page_num ?? null,
        section: it.section ?? it?.metadata?.section ?? "",
        chunk: it.chunk ?? it.text ?? it.content ?? it?.metadata?.text ?? "",
        chunk_index: it.chunk_index ?? it.idx ?? it.index ?? null,
        score: it.score ?? it.similarity ?? it.re_score ?? null,
      })
    );
  } catch (e: any) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

// -------- 정렬/필터 --------
function sortFn(a: ChunkItem, b: ChunkItem) {
  const pa = a.page ?? Number.MAX_SAFE_INTEGER;
  const pb = b.page ?? Number.MAX_SAFE_INTEGER;
  if (pa !== pb) return pa - pb;
  const ia = a.chunk_index ?? Number.MAX_SAFE_INTEGER;
  const ib = b.chunk_index ?? Number.MAX_SAFE_INTEGER;
  if (ia !== ib) return ia - ib;
  return String(a.id ?? "").localeCompare(String(b.id ?? ""));
}
const visibleChunks = computed(() => {
  const qq = q.value.trim().toLowerCase();
  const arr = chunks.value.slice();
  let out = qq
    ? arr.filter(
        (c) =>
          (c.chunk || "").toLowerCase().includes(qq) ||
          (c.section || "").toLowerCase().includes(qq)
      )
    : arr;

  if (sortKey.value === "idx") {
    return out.slice().sort((a, b) => {
      const ia = a.chunk_index ?? Number.MAX_SAFE_INTEGER;
      const ib = b.chunk_index ?? Number.MAX_SAFE_INTEGER;
      if (ia !== ib) return ia - ib;
      return sortFn(a, b);
    });
  }
  return out.slice().sort(sortFn);
});

// -------- 액션 --------
function openPdf(page?: number) {
  if (!pdfKey.value) return;
  const name = title.value || `${docId}.pdf`;
  const url = getViewUrl(pdfKey.value, name, page ?? undefined, origKey.value);
  window.open(url, "_blank", "noopener,noreferrer");
}
function downloadOriginal() {
  if (!origKey.value) return;
  const name = origName.value || title.value || docId;
  const url = getDownloadUrl(origKey.value, name);
  window.open(url, "_blank", "noopener,noreferrer");
}
async function reload() {
  await Promise.all([loadMeta(), loadChunks()]);
}
function loadMore() {
  limit.value += step;
  loadChunks();
}
onMounted(async () => {
  await reload();
});
watch(
  () => route.params.docId,
  async () => {
    chunks.value = [];
    limit.value = 300;
    await reload();
  }
);
</script>
