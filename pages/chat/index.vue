<template>
  <div class="h-screen w-full bg-zinc-950 text-zinc-100 flex">
    <div class="flex-1 min-h-0 max-w-5xl mx-auto flex flex-col">
      <!-- Header -->
      <div
        class="px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950/80 backdrop-blur z-10"
      >
        <div class="flex items-center justify-between">
          <div class="text-lg font-semibold">RAG Chat</div>

          <!-- 우측 상태/토글 -->
          <div class="relative text-xs text-zinc-400 docs-toggle-area">
            <button
              v-if="hasData"
              type="button"
              class="px-2 py-1 rounded-md hover:bg-zinc-800/60"
              @click="docsOpen = !docsOpen"
            >
              문서 {{ docs.length }}개 ▾
            </button>
            <template v-else>
              <span v-if="progress >= 100" class="text-emerald-400"
                >임베딩 완료</span
              >
              <span v-else-if="jobId">임베딩 진행 중… {{ progress }}%</span>
              <span v-else>문서 업로드 대기</span>
            </template>

            <!-- 토글 목록 -->
            <div
              v-if="docsOpen"
              class="absolute right-0 mt-2 w-[22rem] max-h-[11.2rem] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/95 shadow-lg p-2 scrollbar-zinc"
            >
              <div
                v-if="!docs.length"
                class="px-3 py-6 text-center text-zinc-400"
              >
                목록이 비어 있습니다.
              </div>
              <ul v-else class="text-sm divide-y divide-zinc-800">
                <li
                  v-for="d in docs"
                  :key="d.object_key || d.doc_id"
                  class="py-2 px-2 flex items-center justify-between gap-2"
                >
                  <div class="truncate">
                    <div class="font-medium truncate">
                      {{ d.title || d.doc_id }}
                    </div>
                    <div v-if="d.uploaded_at" class="text-[11px] text-zinc-500">
                      {{ d.uploaded_at }}
                    </div>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 text-xs px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700"
                    @click="openPdf(d)"
                  >
                    원본 열기
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Body: only chat scrolls -->
      <div class="flex-1 min-h-0 flex flex-col">
        <div
          v-if="messages.length === 0"
          class="flex-1 min-h-0 grid place-items-center p-6"
        >
          <div class="w-full max-w-xl space-y-6">
            <RagUploadCenter
              :disabled="uploading"
              @select="onUpload"
              :title="hasData ? '문서 추가 업로드' : '문서 업로드'"
              :description="
                hasData
                  ? '추가로 문서를 업로드하여 지식을 확장합니다.'
                  : 'PDF / DOCX / HWPX 파일을 선택하면 임베딩을 시작합니다.'
              "
              :button-text="hasData ? '추가로 업로드 하기' : '업로드 하기'"
            />
            <div v-if="jobId" class="pt-2">
              <RagProgressBar :value="progress" />
              <div class="text-xs text-zinc-500 mt-1">
                임베딩이 100%가 되면 질문을 시작할 수 있어요.
              </div>
            </div>
          </div>
        </div>

        <!-- Chat list -->
        <div
          v-else
          ref="chatScroller"
          class="flex-1 min-h-0 overflow-y-auto space-y-4 p-4 scrollbar-zinc"
          style="scrollbar-gutter: stable"
        >
          <RagMessageBubble v-for="m in messages" :key="m.id" :msg="m" />
          <div ref="endRef" />
        </div>

        <div
          v-if="jobId && progress < 100"
          class="shrink-0 px-4 py-2 bg-zinc-900 border-t border-zinc-800"
        >
          <RagProgressBar :value="progress" label="인덱싱 진행률" />
        </div>
      </div>

      <!-- Input: enabled if hasData or indexing finished -->
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
import {
  ref,
  watch,
  nextTick,
  computed,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useApi, type ChatMessage, type DocItem } from "@/composables/useApi";

import RagUploadCenter from "@/components/Chat/UploadCenter.vue";
import RagProgressBar from "~/components/Chat/ProgressBar.vue";
import RagMessageBubble from "@/components/Chat/MessageBubble.vue";
import RagInputBar from "@/components/Chat/InputBar.vue";

const {
  uploadDocument,
  getJobProgress,
  sendChat,
  getStatus,
  listDocs,
  getFileUrl,
} = useApi();

const messages = ref<ChatMessage[]>([]);
const uploading = ref(false);
const jobId = ref<string | null>(null);
const progress = ref(0);
const blocking = ref(true);

// ===== 문서 목록/상태 =====
const hasData = ref(false);
const docsOpen = ref(false);
const docs = ref<DocItem[]>([]);

async function refreshStatusAndDocs() {
  try {
    const s = await getStatus();
    hasData.value = !!s.has_data;
  } catch {
    hasData.value = false;
  }
  if (hasData.value) {
    try {
      docs.value = await listDocs();
    } catch {
      docs.value = [];
    }
  } else {
    docs.value = [];
  }
}

onMounted(() => {
  refreshStatusAndDocs();
  window.addEventListener("click", onGlobalClick);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", onGlobalClick);
});

// 헤더 토글 외부 클릭 시 닫기
function onGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest(".docs-toggle-area")) docsOpen.value = false;
}
const encodeObjectPath = (k: string) =>
  k.split("/").map(encodeURIComponent).join("/");
// PDF 보기(프리사인 URL을 새 탭으로)
async function openPdf(d: DocItem) {
  try {
    const runtime = useRuntimeConfig();
    const API = (runtime.public.apiBase || "/llama").replace(/\/+$/, "");
    const name = d.title || d.doc_id || "document.pdf";
    const pathKey = encodeObjectPath(String(d.object_key));
    const url = `${API}/view/${pathKey}?name=${encodeURIComponent(name)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (e) {
    alert("파일 URL 생성 실패");
    console.warn(e);
  }
}

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
      if (progress.value >= 100) {
        clearInterval(timer);
        hasData.value = true;
        try {
          docs.value = await listDocs();
        } catch {
          docs.value = [];
        }
      }
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

const canChat = computed(
  () => hasData.value || (!blocking.value && progress.value >= 100)
);

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

function onInputResize(_h: number) {
  // 입력창 높이가 변하면 하단 고정 유지
  scrollToEnd("auto");
}
</script>
