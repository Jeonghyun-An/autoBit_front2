<template>
  <div class="px-3 py-2">
    <div class="max-w-5xl mx-auto">
      <!-- 채팅창과 버튼을 나란히 배치 -->
      <div class="flex items-end gap-3">
        <!-- Textarea 영역 -->
        <textarea
          ref="taRef"
          class="flex-1 resize-none overflow-y-auto rounded-3xl text-black placeholder-zinc-500 p-3 focus:outline-none focus:ring-2 focus:ring-slate-900 scrollbar-zinc border border-slate-900"
          rows="1"
          style="scrollbar-gutter: stable; line-height: 1.5rem"
          :placeholder="
            disabled
              ? '챗봇 가동중... 잠시만 기다려주세요.'
              : '질문을 입력하세요. 무엇이 궁금한가요?'
          "
          v-model="value"
          :disabled="disabled"
          @keydown="onKeyDown"
        />

        <!-- 전송 버튼: 항상 하단에 고정 -->
        <button
          type="button"
          class="flex-shrink-0 w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          :disabled="disabled || !value.trim()"
          title="전송 (Enter)"
          @click="submit"
        >
          <Icon name="mingcute:send-plane-fill" class="w-6 h-6 text-white" />
        </button>
      </div>

      <!-- 안내 텍스트 -->
      <div class="mt-2 text-xs text-zinc-500">
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

  // 높이 초기화 후 스크롤 높이 계산
  ta.style.height = "0px";
  const lineHeight = parseFloat(getComputedStyle(ta).lineHeight || "24");
  const paddingY =
    parseFloat(getComputedStyle(ta).paddingTop || "0") +
    parseFloat(getComputedStyle(ta).paddingBottom || "0");
  const maxPx = props.maxRows * lineHeight + paddingY;

  // 최대 높이 제한
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

// 외부에서 호출할 수 있는 포커스 메서드
function focus() {
  taRef.value?.focus();
}

// defineExpose로 부모 컴포넌트에서 접근 가능하도록 노출
defineExpose({
  focus,
});

onMounted(() => {
  autoresize();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});
</script>

<style scoped>
/* 스크롤바 자체를 안 보이게 (휠 스크롤은 그대로 가능) */
.scrollbar-zinc {
  /* Firefox */
  scrollbar-width: none;
}

/* Chrome, Edge, Safari 계열 */
.scrollbar-zinc::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 혹시 남아있을 버튼/화살표 방지용(안전빵) */
.scrollbar-zinc::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}
</style>
