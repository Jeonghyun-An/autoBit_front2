<template>
  <div class="border-t border-zinc-800 p-3 bg-zinc-950">
    <div class="flex items-end gap-2">
      <textarea
        ref="taRef"
        class="flex-1 resize-none rounded-xl bg-zinc-900 text-zinc-100 placeholder-zinc-500 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        rows="1"
        :placeholder="
          disabled
            ? '임베딩이 완료되면 질문할 수 있어요…'
            : '질문을 입력하세요. Shift+Enter 줄바꿈'
        "
        v-model="value"
        :disabled="disabled"
        @keydown="onKeyDown"
      />
      <button
        class="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="disabled"
        title="전송"
        @click="submit"
      >
        전송
      </button>
    </div>
    <div class="mt-1 text-xs text-zinc-500">
      Enter: 전송 · Shift+Enter: 줄바꿈
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const emit = defineEmits<{ (e: "send", text: string): void }>();
const props = defineProps<{ disabled?: boolean }>();

const value = ref("");
const taRef = ref<HTMLTextAreaElement | null>(null);

function autoresize() {
  const ta = taRef.value;
  if (!ta) return;
  ta.style.height = "0px";
  ta.style.height = Math.min(200, ta.scrollHeight) + "px";
}

watch(value, autoresize);

function submit() {
  const v = value.value.trim();
  if (!v) return;
  emit("send", v);
  value.value = "";
  autoresize();
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!props.disabled) submit();
  }
}

onMounted(() => autoresize());
</script>
