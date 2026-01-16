<template>
  <div class="h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col">
    <!-- <header
      class="shrink-0 px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-4"
    >
      <div class="flex items-center gap-4 min-w-0 flex-1">
        <button
          type="button"
          class="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 shrink-0"
          @click="goBack"
          aria-label="뒤로가기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 1024 1024"
          >
            <path
              fill="currentColor"
              d="M685.248 104.704a64 64 0 0 1 0 90.496L368.448 512l316.8 316.8a64 64 0 0 1-90.496 90.496L232.704 557.248a64 64 0 0 1 0-90.496l362.048-362.048a64 64 0 0 1 90.496 0"
            />
          </svg>
        </button>
        <div
          class="font-medium break-all min-w-0 flex-1"
          :title="displayName || '문서 보기'"
        >
          {{ displayName || "문서 보기" }}
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <a
          v-if="downloadUrl"
          :href="downloadUrl"
          target="_blank"
          rel="noopener"
          class="px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm whitespace-nowrap"
        >
          원본 다운로드
        </a>
      </div>
    </header> -->

    <main class="flex-1 min-h-0">
      <div
        v-if="!objectKey"
        class="h-full grid place-items-center text-zinc-400 px-6 text-center"
      >
        <div class="max-w-2xl break-words">
          <div class="text-lg font-semibold mb-2">잘못된 접근입니다</div>
          <!-- <p class="text-sm break-all">
            /viewer?object=uploaded/파일명.pdf&name=표시이름&orig=uploaded/originals/원본파일
            형태로 접근해주세요.
          </p> -->
        </div>
      </div>

      <iframe
        v-else
        :src="viewerUrl"
        class="w-full h-full"
        title="PDF Viewer"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRoute, navigateTo } from "#imports";
import { useApi } from "@/composables/useApi";

const route = useRoute();
const { getViewUrl, getDownloadUrl, getMetaByDocId } = useApi();

// 보기용(PDF) object
const objectKey = computed(() => String(route.query.object || ""));
// 다운로드용(원본) object — 없으면 PDF로 폴백
const origKey = computed(() =>
  String(route.query.orig || route.query.object || "")
);

// 표시 이름: 쿼리 name > meta.title > 파일명
const resolvedTitle = ref<string>(""); // meta.title 보관

// objectKey -> docId 추출 (uploaded/53.pdf → 53)
function extractDocIdFromKey(key: string) {
  const base = key.split("/").pop() || key;
  return base.replace(/\.pdf$/i, "");
}

onMounted(async () => {
  const qName = String(route.query.name || "");
  if (qName) {
    resolvedTitle.value = qName;
  } else if (objectKey.value) {
    const docId = extractDocIdFromKey(objectKey.value);
    const meta = await getMetaByDocId(docId);
    resolvedTitle.value = meta?.title || docId;
  }
});

const displayName = computed(() => {
  return (
    resolvedTitle.value ||
    String(route.query.name || "") ||
    objectKey.value.split("/").pop() ||
    "문서.pdf"
  );
});

// page 쿼리가 있으면 해당 페이지로 열기
const page = computed(() => {
  const raw = String(route.query.page ?? "");
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
});

// 뷰어 URL: /view/{PDF} + #page
const viewerUrl = computed(() => {
  if (!objectKey.value) return "";
  let url = getViewUrl(objectKey.value, displayName.value);
  if (page.value) url += `#page=${page.value}`;
  return url;
});

// 다운로드 URL: /download/{원본}  (orig가 없으면 PDF로 폴백)
const downloadUrl = computed(() => {
  if (!origKey.value) return "";
  return getDownloadUrl(origKey.value, displayName.value);
});
</script>
