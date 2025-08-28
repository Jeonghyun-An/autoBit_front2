<template>
  <div class="h-screen w-full bg-zinc-950 text-zinc-100 flex">
    <div class="flex-1 max-w-5xl mx-auto flex flex-col">
      <!-- Header -->
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

      <!-- Body -->
      <div class="flex-1 flex flex-col">
        <div
          v-if="messages.length === 0"
          class="flex-1 grid place-items-center p-6"
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

        <div v-else class="flex-1 overflow-auto space-y-4 p-4">
          <RagMessageBubble v-for="m in messages" :key="m.id" :msg="m" />
          <div ref="endRef" />
        </div>

        <div
          v-if="jobId && progress < 100"
          class="px-4 py-2 bg-zinc-900 border-t border-zinc-800"
        >
          <RagProgressBar :value="progress" label="인덱싱 진행률" />
        </div>
      </div>

      <!-- Input -->
      <RagInputBar :disabled="!canChat" @send="onSend" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
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
watch(messages, async () => {
  await nextTick();
  endRef.value?.scrollIntoView({ behavior: "smooth" });
});

watch(jobId, (val) => {
  if (!val) return;
  // poll progress
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
    jobId.value = job_id ?? null;
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
</script>

<style>
/* If you don't use Tailwind, you can replace classes or add your own minimal styles here. */
</style>
