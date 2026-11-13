<template>
  <div
    :class="[
      'flex w-full gap-2 items-start',
      isUser ? 'justify-end' : 'justify-start',
    ]"
  >
    <!-- 아이콘 영역: assistant일 때만 표시 -->
    <div v-if="!isUser" class="chat_ico shrink-0">
      <img :src="bgImage" alt="Assistant Icon" />
    </div>

    <div
      :class="[
        'max-w-[82%] rounded-2xl p-4 shadow min-w-0',
        isUser
          ? 'bg-zinc-300 text-gray-950 rounded-br-sm shadow-md'
          : 'bg-slate-900 text-white border',
      ]"
    >
      <!-- 본문: 사용자 = 그대로, 어시스턴트 = Markdown 렌더 -->
      <div
        v-if="isUser"
        class="text-sm whitespace-pre-wrap leading-relaxed break-words"
      >
        {{ msg.content }}
      </div>
      <div
        v-else
        class="answer-body prose prose-sm prose-invert max-w-none leading-relaxed"
        style="word-break: break-word; overflow-wrap: break-word"
        v-html="html"
      />

      <!-- 타임스탬프 -->
      <div class="mt-2 text-[11px] opacity-70">
        {{ timeLabel(new Date(msg.created_at)) }}
      </div>
      <div v-if="!isUser" class="mt-3 w-full">
        <button
          class="text-xs px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 whitespace-nowrap"
          @click="open = !open"
        >
          {{ open ? "근거 닫기" : "근거 보기 (Top-k)" }}
        </button>
        <div v-if="open" class="mt-3 w-full">
          <RagSourceList :sources="msg.sources" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import RagSourceList from "./SourceList.vue";
import type { ChatMessage } from "@/composables/useApi";
import { renderMarkdown } from "@/composables/useMarkdown";
import bgPng from "@/assets/img/ic_floating_chat.png";

const props = defineProps<{ msg: ChatMessage }>();
const isUser = computed(() => props.msg.role === "user");
const open = ref(false);
const bgImage = ref(bgPng);

// assistant 메시지용 Markdown HTML
const html = computed(() =>
  isUser.value ? "" : renderMarkdown(props.msg.content || ""),
);

function timeLabel(d = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}
</script>

<style scoped>
/* 답변 말풍선은 배경이 항상 어둡기 때문에(bg-slate-900) 글씨는 항상 흰색으로 둔다.
   예전 dark:prose-invert 는 OS·브라우저가 다크 모드일 때만 적용돼, 라이트 모드에서는
   prose 기본 글씨색(짙은 회색)이 검은 배경에 묻혔다. 테두리·구분선 색은 prose-invert 기본값을 쓴다. */
.answer-body {
  --tw-prose-invert-body: #fff;
  --tw-prose-invert-headings: #fff;
  --tw-prose-invert-lead: #fff;
  --tw-prose-invert-links: #fff;
  --tw-prose-invert-bold: #fff;
  --tw-prose-invert-counters: #fff;
  --tw-prose-invert-bullets: #fff;
  --tw-prose-invert-quotes: #fff;
  --tw-prose-invert-captions: #fff;
  --tw-prose-invert-code: #fff;
  --tw-prose-invert-pre-code: #fff;
  --tw-prose-invert-kbd: #fff;
}

/* 선택: 코드/프리티어 스타일 조금 강화 */
.prose :where(pre, code) {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
}
.prose :where(pre) {
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: rgb(24 24 27); /* zinc-900 */
  border: 1px solid rgb(39 39 42); /* zinc-800 */
  overflow-x: auto;
  max-width: 100%;
}

/* 모든 자식 요소에 줄바꿈 허용 (숨기지 않음) */
.prose * {
  word-break: break-word;
  overflow-wrap: break-word;
}

.prose table {
  display: block;
  overflow-x: auto;
  max-width: 100%;
}

.prose img {
  max-width: 100%;
  height: auto;
}

/* 챗봇 아이콘 스타일 */
.chat_ico {
  width: 48px;
  height: 48px;
  background: #ffffff;
  border: 1px solid #d4d4d8; /* zinc-300 */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 8px;
}

.chat_ico img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
