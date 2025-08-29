<template>
  <div class="h-screen w-full bg-zinc-950 text-zinc-100 flex">
    <!-- min-h-0 추가 -->
    <div class="flex-1 min-h-0 max-w-5xl mx-auto flex flex-col">
      <!-- Header (고정) -->
      <div
        class="px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950/80 backdrop-blur z-10"
      >
        <div class="flex items-center justify-between">
          <div class="text-lg font-semibold">RAG Chat</div>
          <div class="text-xs text-zinc-400">
            <span v-if="progress >= 100" class="text-emerald-400"
              >임베딩 완료</span
            >
            <span v-else-if="jobId">임베딩 진행 중… {{ progress }}%</span>
            <span v-else>문서 업로드 대기</span>
          </div>
        </div>
      </div>

      <!-- Body: 가운데만 스크롤 -->
      <div class="flex-1 min-h-0 flex flex-col">
        <div
          v-if="messages.length === 0"
          class="flex-1 min-h-0 grid place-items-center p-6"
        >
          <div class="w-full max-w-xl space-y-6">
            <RagUploadCenter :disabled="uploading" @select="onUpload" />
            <div v-if="jobId" class="pt-2">
              <RagProgressBar :value="progress" />
              <div class="text-xs text-zinc-500 mt-1">
                임베딩이 100%가 되면 질문을 시작할 수 있어요.
              </div>
            </div>
          </div>
        </div>

        <!-- 버블 영역만 스크롤 -->
        <div
          v-else
          ref="chatScroller"
          class="flex-1 min-h-0 overflow-y-auto space-y-4 p-4"
        >
          <RagMessageBubble v-for="m in messages" :key="m.id" :msg="m" />
          <div ref="endRef" />
        </div>

        <!-- 인덱싱 진행 바 (하단 고정) -->
        <div
          v-if="jobId && progress < 100"
          class="shrink-0 px-4 py-2 bg-zinc-900 border-t border-zinc-800"
        >
          <RagProgressBar :value="progress" label="인덱싱 진행률" />
        </div>
      </div>

      <!-- Input: 하단 고정 + 자동리사이즈, 높이 변하면 버블 영역을 아래에 붙임 -->
      <div class="shrink-0">
        <RagInputBar
          :disabled="!canChat"
          @send="onSend"
          @height-changed="onInputResize"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import { useApi, type ChatMessage } from "@/composables/useApi";
import RagUploadCenter from "@/components/Rag/UploadCenter.vue";
import RagProgressBar from "~/components/Rag/ProgressBar.vue";
import RagMessageBubble from "@/components/Rag/MessageBubble.vue";
import RagInputBar from "@/components/Rag/InputBar.vue";

const { uploadDocument, getJobProgress, sendChat } = useApi();

const messages = ref<ChatMessage[]>([]);
const uploading = ref(false);
const jobId = ref<string | null>(null);
const progress = ref(0);
const blocking = ref(true);

const endRef = ref<HTMLElement | null>(null);
const chatScroller = ref<HTMLElement | null>(null);

function scrollToEnd(behavior: ScrollBehavior = "smooth") {
  nextTick(() => {
    endRef.value?.scrollIntoView({ behavior, block: "end" });
    const el = chatScroller.value;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  });
}

watch(messages, () => scrollToEnd("smooth"));

watch(jobId, (val) => {
  if (!val) return;
  const timer = setInterval(async () => {
    try {
      const s = await getJobProgress(val);
      progress.value = s.progress ?? 0;
      blocking.value = (s.progress ?? 0) < 100;
      if (progress.value >= 100) clearInterval(timer);
    } catch (e) {
      console.warn("progress error", e);
    }
  }, 1500);
});

const onUpload = async (file: File) => {
  uploading.value = true;
  progress.value = 0;
  try {
    const { job_id } = await uploadDocument(file);
    jobId.value = job_id;
  } catch (e: any) {
    alert(`업로드 실패: ${e?.message || e}`);
  } finally {
    uploading.value = false;
  }
};

const canChat = computed(() => !blocking.value && progress.value >= 100);

const onSend = async (query: string) => {
  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: query,
    created_at: new Date().toISOString(),
  };
  messages.value = [...messages.value, userMsg];

  try {
    const history = messages.value.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const { answer, sources } = await sendChat(history, query);
    const botMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: answer,
      created_at: new Date().toISOString(),
      sources,
    };
    messages.value = [...messages.value, botMsg];
  } catch (e: any) {
    const botMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `오류가 발생했습니다. 관리자에게 문의해주세요.\n\n${
        e?.message || e
      }`,
      created_at: new Date().toISOString(),
    };
    messages.value = [...messages.value, botMsg];
  }
};

// 입력창 높이 변하면 버블 영역을 아래에 붙임
function onInputResize(_: number) {
  scrollToEnd("auto");
}
</script>
