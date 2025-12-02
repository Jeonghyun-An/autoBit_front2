<template>
  <div :class="['flex w-full gap-3', isUser ? 'justify-end' : 'justify-start']">
    <!-- 아이콘 영역: assistant일 때만 표시 -->
    <div v-if="!isUser" class="chat_ico shrink-5">
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
        class="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
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
  isUser.value ? "" : renderMarkdown(props.msg.content || "")
);

function timeLabel(d = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}
</script>

<style scoped>
/* 선택: 코드/프리티어 스타일 조금 강화 */
.prose :where(pre, code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
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
