<template>
  <div class="px-3 py-2">
    <div class="max-w-5xl mx-auto">
      <!-- 답변 모드 선택 버튼 (Textarea 위에 배치) -->
      <div class="mb-2 flex items-center gap-2">
        <span class="text-xs text-zinc-600 font-medium">답변 모드:</span>
        <div
          class="inline-flex rounded-lg border border-slate-300 bg-white overflow-hidden"
        >
          <button
            type="button"
            :class="[
              'px-4 py-1.5 text-sm font-medium transition-colors',
              responseType === 'short'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100',
            ]"
            @click="responseType = 'short'"
          >
            단문형
          </button>
          <button
            type="button"
            :class="[
              'px-4 py-1.5 text-sm font-medium transition-colors border-l border-slate-300',
              responseType === 'long'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100',
            ]"
            @click="responseType = 'long'"
          >
            장문형
          </button>
        </div>
        <span class="text-xs text-zinc-500">
          {{
            responseType === "short"
              ? "(간결한 답변, 빠른 응답)"
              : "(상세한 답변, 더 많은 컨텍스트)"
          }}
        </span>
      </div>

      <!-- 채팅창과 버튼을 나란히 배치 -->
      <div class="flex items-end gap-3">
        <!-- Textarea 영역 -->
        <textarea
          ref="taRef"
          :class="[
            'flex-1 resize-none rounded-3xl text-black placeholder-zinc-500 p-3 pr-0 focus:outline-none focus:ring-2 focus:ring-slate-900 border border-slate-900',
            isOverflowing ? 'scrollbar-visible' : 'scrollbar-hidden',
          ]"
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
  (e: "send", text: string, responseType: "short" | "long"): void;
  (e: "height-changed", height: number): void;
}>();
const props = withDefaults(
  defineProps<{ disabled?: boolean; maxRows?: number }>(),
  { maxRows: 8 }
);

const value = ref("");
const taRef = ref<HTMLTextAreaElement | null>(null);
const responseType = ref<"short" | "long">("short");
const isOverflowing = ref(false); // 🆕 오버플로우 상태

// 답변 모드 변경 시 localStorage 저장
watch(responseType, (newType) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("rag_response_type", newType);
  }
});

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

  // 🆕 오버플로우 체크: scrollHeight가 maxPx보다 크면 오버플로우
  isOverflowing.value = ta.scrollHeight > maxPx;

  // 최대 높이 제한
  ta.style.height = Math.min(ta.scrollHeight, maxPx) + "px";

  // 🆕 오버플로우 시 overflow-y 설정
  if (isOverflowing.value) {
    ta.style.overflowY = "auto";
  } else {
    ta.style.overflowY = "hidden";
  }

  emit("height-changed", ta.offsetHeight);
}

watch(value, () => autoresize());

function submit() {
  const v = value.value.trim();
  if (!v) return;
  emit("send", v, responseType.value);
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
  // localStorage에서 저장된 모드 복원
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("rag_response_type");
    if (saved === "short" || saved === "long") {
      responseType.value = saved;
    }
  }

  autoresize();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});
</script>

<style scoped>
/* 오버플로우 없을 때: 스크롤바 완전히 숨김 */
.scrollbar-hidden {
  overflow-y: hidden;
  scrollbar-width: none; /* Firefox */
}

.scrollbar-hidden::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 오버플로우 있을 때: 스크롤바 표시 */
.scrollbar-visible {
  overflow-y: auto;
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #d4d4d9 transparent; /* Firefox: thumb track */
}

/* Chrome, Edge, Safari: 스크롤바 스타일링 */
.scrollbar-visible::-webkit-scrollbar {
  width: 8px;
}

.scrollbar-visible::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-visible::-webkit-scrollbar-thumb {
  background: #d4d4d9; /* zinc-400 */
  border-radius: 4px;
}

.scrollbar-visible::-webkit-scrollbar-thumb:hover {
  background: #a1a1aa; /* zinc-500 */
}

.scrollbar-visible::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}
</style>
