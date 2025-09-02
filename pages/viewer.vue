<template>
  <div class="h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col">
    <header
      class="shrink-0 px-4 py-3 border-b border-zinc-800 flex items-center justify-between"
    >
      <div class="flex items-center gap-4">
        <button
          type="button"
          class="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700"
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
        <div class="font-medium truncate max-w-[60vw]">
          {{ displayName || "문서 보기" }}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <a
          v-if="downloadUrl"
          :href="downloadUrl"
          target="_blank"
          rel="noopener"
          class="px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm"
        >
          원본 다운로드
        </a>
      </div>
    </header>

    <main class="flex-1 min-h-0">
      <div
        v-if="!objectKey"
        class="h-full grid place-items-center text-zinc-400 px-6 text-center"
      >
        <div>
          <div class="text-lg font-semibold mb-2">문서 키가 없습니다</div>
          <p class="text-sm">
            /viewer?object=uploaded/파일명.pdf&name=표시이름&orig=uploaded/originals/원본파일
            형태로 접근해주세요.
          </p>
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
import { computed } from "vue";
import { useRoute, navigateTo } from "#imports";
import { useApi } from "@/composables/useApi";

const route = useRoute();
const { getViewUrl, getDownloadUrl } = useApi();

// 보기용(PDF) object
const objectKey = computed(() => String(route.query.object || ""));
// 다운로드용(원본) object — 없으면 PDF로 폴백
const origKey = computed(() =>
  String(route.query.orig || route.query.object || "")
);

// 표시 이름
const displayName = computed(() => {
  const qn = String(route.query.name || "");
  if (qn) return qn;
  const base = objectKey.value.split("/").pop() || "문서.pdf";
  return base;
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

function goBack() {
  if (history.length > 1) history.back();
  else navigateTo("/");
}
</script>
