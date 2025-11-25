<template>
  <div class="border-t border-zinc-800 bg-zinc-950 px-3 py-2">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-end gap-2">
        <textarea
          ref="taRef"
          class="flex-1 resize-none overflow-y-auto rounded-xl bg-zinc-900 text-zinc-100 placeholder-zinc-500 p-3 pr-2 focus:outline-none focus:ring-2 focus:ring-zinc-200 scrollbar-zinc"
          rows="1"
          style="scrollbar-gutter: stable"
          :placeholder="
            disabled
              ? '챗봇 가동중... 잠시만 기다려주세요.'
              : '질문을 입력하세요. 무엇이 궁금한가요?'
          "
          v-model="value"
          :disabled="disabled"
          @keydown="onKeyDown"
        />
        <button
          type="button"
          class="px-4 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-bold"
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";

const emit = defineEmits<{
  (e: "send", text: string): void;
  (e: "height-changed", height: number): void;
}>();
const props = withDefaults(
  defineProps<{ disabled?: boolean; maxRows?: number }>(),
  { maxRows: 8 }
);

const value = ref("");
const taRef = ref<HTMLTextAreaElement | null>(null);

function autoresize() {
  const ta = taRef.value;
  if (!ta) return;
  ta.style.height = "0px";
  const lineHeight = parseFloat(getComputedStyle(ta).lineHeight || "20");
  const paddingY =
    parseFloat(getComputedStyle(ta).paddingTop || "0") +
    parseFloat(getComputedStyle(ta).paddingBottom || "0");
  const maxPx = props.maxRows * lineHeight + paddingY;
  ta.style.height = Math.min(ta.scrollHeight, maxPx) + "px";
  emit("height-changed", ta.offsetHeight);
}

watch(value, () => autoresize());

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

function onResize() {
  autoresize();
}

onMounted(() => {
  autoresize();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});
</script>
