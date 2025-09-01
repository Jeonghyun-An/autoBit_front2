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
          v-if="url"
          :href="url"
          download
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
        v-if="error"
        class="h-full grid place-items-center text-zinc-400 px-6 text-center"
      >
        <div>
          <div class="text-lg font-semibold mb-2">문서를 열 수 없습니다</div>
          <p class="text-sm">{{ error }}</p>
        </div>
      </div>

      <iframe
        v-else-if="url"
        :src="url"
        class="w-full h-full"
        title="PDF Viewer"
      />
      <div v-else class="h-full grid place-items-center text-zinc-400">
        불러오는 중…
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "#imports";
import { useApi } from "@/composables/useApi";

const route = useRoute();
const { getFileUrl } = useApi();

const url = ref<string | null>(null);
const error = ref<string | null>(null);

const objectKey = String(route.query.object || "");
const displayName = String(
  route.query.name || objectKey.split("/").pop() || "문서"
);

async function load() {
  try {
    const { url: presigned } = await getFileUrl(objectKey, 60, displayName);
    url.value = presigned;
  } catch (e: any) {
    error.value = e?.message || "프리사인 URL 생성 실패";
  }
}

function goBack() {
  if (history.length > 1) history.back();
  else navigateTo("/");
}

onMounted(load);
</script>
