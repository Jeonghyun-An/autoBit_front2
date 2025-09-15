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
        >
          원문 열기
        </a>

        <!-- 3) url이 비어있으면 폴백 핸들러로 동작 -->
        <button
          v-else
          type="button"
          class="underline underline-offset-2 hover:text-zinc-200"
          @click="openSource(s)"
        >
          원문 보기
        </button>
        <button
          v-if="s.doc_id"
          type="button"
          class="underline underline-offset-2 hover:text-zinc-200"
          @click="downloadSourceOriginal(s)"
        >
          원본 다운로드
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
</script>
