<template>
  <div :class="['flex w-full', isUser ? 'justify-end' : 'justify-start']">
    <div
      :class="[
        'max-w-[82%] rounded-2xl p-4 shadow',
        isUser
          ? 'bg-indigo-500 text-white rounded-br-sm'
          : 'bg-zinc-900 text-zinc-100 rounded-bl-sm border border-zinc-800',
      ]"
    >
      <!-- 본문: 사용자 = 그대로, 어시스턴트 = Markdown 렌더 -->
      <div v-if="isUser" class="text-sm whitespace-pre-wrap leading-relaxed">
        {{ msg.content }}
      </div>
      <div
        v-else
        class="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
        v-html="html"
      />

      <!-- 타임스탬프 -->
      <div class="mt-2 text-[11px] opacity-70">
        {{ timeLabel(new Date(msg.created_at)) }}
      </div>
      <div v-if="!isUser" class="mt-3">
        <button
          class="text-xs px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700"
          @click="open = !open"
        >
          {{ open ? "근거 닫기" : "근거 보기 (Top-k)" }}
        </button>
        <div v-if="open" class="mt-3">
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

const props = defineProps<{ msg: ChatMessage }>();
const isUser = computed(() => props.msg.role === "user");
const open = ref(false);

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
}
</style>
