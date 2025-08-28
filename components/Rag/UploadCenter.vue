<template>
  <div
    class="flex flex-col items-center justify-center text-center p-10 rounded-2xl border-2 border-dashed border-zinc-400/40 hover:border-zinc-300 transition cursor-pointer bg-zinc-900/10 backdrop-blur-sm"
  >
    <div class="text-2xl font-semibold mb-2">문서 업로드</div>
    <p class="text-sm text-zinc-400 mb-4">
      파일을 선택하면 임베딩을 시작합니다.
    </p>
    <button
      class="px-4 py-2 rounded-xl bg-white/90 text-zinc-900 font-medium shadow hover:bg-white disabled:opacity-50"
      :disabled="disabled"
      @click="openFileDialog"
    >
      파일 선택
    </button>
    <input
      ref="fileInput"
      type="file"
      accept=".pdf,.docx,.hwpx"
      class="hidden"
      :disabled="disabled"
      @change="onChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{ (e: "select", file: File): void }>();
defineProps<{ disabled?: boolean }>();

const fileInput = ref<HTMLInputElement | null>(null);

function openFileDialog() {
  fileInput.value?.click();
}

function onChange(e: Event) {
  const t = e.target as HTMLInputElement;
  const f = t.files?.[0];
  if (f) emit("select", f);
  // 파일 선택 후 같은 파일을 다시 선택 가능하도록 값 리셋(옵션)
  if (t) t.value = "";
}
</script>
