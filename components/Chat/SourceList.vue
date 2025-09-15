<template>
  <div v-if="!sources?.length" class="text-sm text-zinc-400">
    연결된 근거가 없습니다.
  </div>
  <div v-else class="space-y-2">
    <div
      v-for="(s, i) in sources"
      :key="s.id || i"
      class="rounded-xl border border-zinc-800 p-3 bg-zinc-900/40"
    >
      <div class="flex items-center justify-between gap-3">
        <span v-if="typeof s.score === 'number'" class="text-xs text-zinc-400">
          score {{ s.score.toFixed(3) }}
        </span>
      </div>

      <div class="mt-1 text-sm text-zinc-300 whitespace-pre-line">
        {{ (s.snippet && s.snippet.trim()) || s.metadata?.text?.slice(0, 500) }}
      </div>

      <div class="mt-2 text-xs text-zinc-400 flex flex-wrap gap-2">
        <span v-if="s.page != null">p.{{ s.page }}</span>
        <span v-if="s.chunk_index != null">chunk #{{ s.chunk_index }}</span>
        <span v-if="s.metadata?.section"
          >section: {{ s.metadata.section }}</span
        >

        <!-- 1) url이 앱 내부 라우트(/로 시작)면 NuxtLink -->
        <NuxtLink
          v-if="s.url && s.url.startsWith('/')"
          :to="s.url"
          class="underline underline-offset-2 hover:text-zinc-200"
          target="_blank"
          rel="noreferrer"
          title="해당 청크가 위치한 페이지를 새 탭에서 엽니다"
        >
          원문 열기
        </NuxtLink>

        <!-- 2) 외부 URL이면 a 링크 -->
        <a
          v-else-if="s.url"
          :href="s.url"
          class="underline underline-offset-2 hover:text-zinc-200"
          target="_blank"
          rel="noreferrer"
          title="해당 청크가 위치한 페이지를 새 탭에서 엽니다"
        >
          원문 열기
        </a>

        <!-- 3) url이 비어있으면 폴백 핸들러로 동작 -->
        <button
          v-else
          type="button"
          class="underline underline-offset-2 hover:text-zinc-200"
          @click="openSource(s)"
          title="해당 청크가 위치한 페이지를 새 탭에서 엽니다"
        >
          원문 보기
        </button>
        <button
          v-if="s.doc_id"
          type="button"
          class="underline underline-offset-2 hover:text-zinc-200"
          @click="downloadSourceOriginal(s)"
          title="해당 문서의 원본 파일을 다운로드 합니다"
        >
          원본 다운로드
        </button>
        <button
          type="button"
          class="underline underline-offset-2 hover:text-zinc-200"
          @click="downloadChunk(s)"
          title="해당 청크를 .txt 파일로 다운로드 합니다"
        >
          청크 다운로드
        </button>
        <button
          type="button"
          class="underline underline-offset-2 hover:text-zinc-200"
          @click="downloadChunkJSON(s)"
          title="해당 청크를 JSON 파일로 다운로드 합니다"
        >
          청크 JSON
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SourceMeta } from "@/composables/useApi";
import { useApi } from "@/composables/useApi";

defineProps<{ sources?: SourceMeta[] }>();
const {
  resolveObjectKeyByDocId,
  resolveOriginalByDocId,
  getViewUrl,
  getDownloadUrl,
} = useApi();

async function openSource(s: SourceMeta) {
  try {
    // url이 있으면 그걸 사용 (안전망)
    if (s.url) {
      window.open(s.url, "_blank", "noopener,noreferrer");
      return;
    }
    // doc_id → object_key 매핑해서 뷰어 라우트 구성
    const key = await resolveObjectKeyByDocId(s.doc_id || "");
    if (!key) {
      alert("원문 경로를 찾지 못했습니다.");
      return;
    }
    const name = s.title || `${s.doc_id}.pdf`;
    const viewer = getViewUrl(key, name, s.page ?? undefined);
    window.open(viewer, "_blank", "noopener,noreferrer");
  } catch (e) {
    console.warn(e);
    alert("원문을 여는 중 오류가 발생했습니다.");
  }
}
async function downloadSourceOriginal(s: SourceMeta) {
  try {
    const orig = await resolveOriginalByDocId(s.doc_id || "");
    if (!orig) {
      alert("원본 파일 정보를 찾지 못했습니다.");
      return;
    }
    const url = getDownloadUrl(orig.key, orig.name);
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (e) {
    console.warn(e);
    alert("원본 다운로드 중 오류가 발생했습니다.");
  }
}
function stripMetaLine(t?: string) {
  if (!t) return "";
  if (t.startsWith("META:")) {
    const nl = t.indexOf("\n");
    return nl >= 0 ? t.slice(nl + 1) : "";
  }
  return t;
}

function pickChunkText(s: SourceMeta): string {
  // chat 응답 표준화에 맞춰 최대한 텍스트를 뽑아온다
  const candidate =
    (typeof s.snippet === "string" && s.snippet) ||
    (typeof (s as any).chunk === "string" && (s as any).chunk) ||
    (typeof s?.metadata?.text === "string" && s.metadata!.text) ||
    "";
  return stripMetaLine(candidate).trim();
}

function safeFilename(name: string) {
  // Windows 금지 문자 제거
  return (name || "chunk").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120);
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadChunk(s: SourceMeta) {
  const body = pickChunkText(s);
  if (!body) {
    alert("이 청크에는 저장할 텍스트가 없습니다.");
    return;
  }
  const head =
    `doc_id: ${s.doc_id ?? ""}\n` +
    `page: ${s.page ?? ""}\n` +
    `chunk: ${s.chunk_index ?? ""}\n\n`;
  const fileBase = safeFilename(s.title || s.doc_id || "chunk");
  const filename = `${fileBase}_p${s.page ?? "x"}_chunk${
    s.chunk_index ?? "x"
  }.txt`;
  downloadText(filename, head + body);
}

function downloadChunkJSON(s: SourceMeta) {
  const body = pickChunkText(s);
  const payload = {
    doc_id: s.doc_id ?? null,
    page: s.page ?? null,
    chunk_index: s.chunk_index ?? null,
    section: s.metadata?.section ?? null,
    text: body,
    raw: s, // 원본 메타도 같이 담고 싶으면
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const fileBase = safeFilename(s.title || s.doc_id || "chunk");
  a.href = url;
  a.download = `${fileBase}_p${s.page ?? "x"}_chunk${
    s.chunk_index ?? "x"
  }.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
</script>
