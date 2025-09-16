<template>
  <div class="h-screen w-full bg-zinc-950 text-zinc-100 flex">
    <div class="flex-1 min-h-0 max-w-6xl mx-auto flex flex-col">
      <!-- Header -->
      <div
        class="px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950/80 backdrop-blur z-10"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="text-lg font-semibold truncate">
              {{ title || docId }}
            </div>
            <div class="text-xs text-zinc-400">
              문서 id: <code class="text-zinc-300">{{ docId }}</code>

              <!-- 총 개수 있으면 "로드 / 전체", 없으면 로드된 개수만 -->
              <span v-if="totalChunks != null" class="ml-2">
                {{ chunks.length }} / {{ totalChunks }}
              </span>
              <span v-else-if="chunks.length" class="ml-2">
                총 {{ chunks.length }}개 청크
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <NuxtLink
              to="/"
              class="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs inline-flex items-center gap-1"
            >
              <Icon name="ic:twotone-arrow-back" class="w-4 h-4" />돌아가기
            </NuxtLink>

            <button
              v-if="pdfKey"
              type="button"
              class="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs inline-flex items-center gap-1"
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
              class="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs inline-flex items-center gap-1"
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
            <input type="checkbox" v-model="hideMeta" />
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
        <div v-if="loading" class="text-sm text-zinc-400">
          <Icon name="line-md:loading-twotone-loop" class="w-4 h-4" />
        </div>
        <div v-else-if="error" class="text-sm text-red-400">{{ error }}</div>
        <div v-else-if="!visibleChunks.length" class="text-sm text-zinc-400">
          표시할 청크가 없습니다.
        </div>

        <div
          v-for="(c, i) in visibleChunks"
          :key="c.id || `${c.doc_id}-${c.page}-${i}`"
          class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
        >
          <div class="flex items-center justify-between gap-3">
            <div
              class="text-xs text-zinc-400 flex flex-wrap items-center gap-3"
            >
              <span v-if="c.page != null">p. {{ c.page }}</span>
              <span v-if="c.chunk_index != null"
                >chunk #{{ c.chunk_index }}</span
              >
              <span v-if="c.section" class="truncate max-w-[28rem]"
                >section: {{ c.section }}</span
              >
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                v-if="pdfKey"
                type="button"
                class="text-xs px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700"
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

          <div class="mt-2 text-sm whitespace-pre-wrap leading-6">
            {{ displayText(c.chunk) }}
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
  // 기타 필드 호환
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
const hideMeta = ref(true);
const sortKey = ref<"page" | "idx">("page");

const limit = ref(300); // 최초 로드 개수
const step = 200; // 더 불러오기 증가폭

const canLoadMore = computed(() => chunks.value.length >= limit.value);

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
// 복사된 청크들의 상태를 관리하는 Set 사용
const copiedChunks = ref<Set<string>>(new Set());

// 각 청크의 고유 키 생성 함수
function getChunkKey(c: ChunkItem): string {
  return `${c.doc_id}:${c.page ?? "x"}:${c.chunk_index ?? "x"}:${c.id ?? "x"}`;
}

// 특정 청크가 복사되었는지 확인하는 computed
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

  // 2초 후 복사 상태 제거
  setTimeout(() => {
    copiedChunks.value.delete(key);
  }, 2000);
}

// <script setup>
const totalChunks = ref<number | null>(null);

async function loadCount() {
  try {
    totalChunks.value = await getDocChunkCount(docId);
  } catch {
    totalChunks.value = null; // 실패 시 표시만 로드된 개수로
  }
}

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

function stripMeta(t: string) {
  if (!t) return "";
  if (t.startsWith("META:")) {
    const nl = t.indexOf("\n");
    return nl >= 0 ? t.slice(nl + 1) : "";
  }
  return t;
}
function displayText(t?: string) {
  const body = hideMeta.value ? stripMeta(t || "") : t || "";
  if (!q.value) return body;
  // 간단 강조(선택): 여기선 텍스트 그대로 표시하므로 강조는 생략
  return body;
}

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
    // full=true → 서버에서 자르지 않도록
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
    // 인덱스 → 페이지 → id
    return out.slice().sort((a, b) => {
      const ia = a.chunk_index ?? Number.MAX_SAFE_INTEGER;
      const ib = b.chunk_index ?? Number.MAX_SAFE_INTEGER;
      if (ia !== ib) return ia - ib;
      return sortFn(a, b);
    });
  }
  // 기본: 페이지 → 인덱스 → id
  return out.slice().sort(sortFn);
});

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
    // 다른 문서로 이동했을 때 초기화
    chunks.value = [];
    limit.value = 300;
    await reload();
  }
);
</script>
