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
              class="absolute right-0 mt-2 w-[26rem] max-h-[11.2rem] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/95 shadow-lg p-2 scrollbar-zinc"
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
                  :key="d.doc_id"
                  class="py-2 px-2 flex items-center justify-between gap-2 min-w-0"
                >
                  <div class="truncate min-w-0 gap-1">
                    <div class="font-medium truncate">
                      {{ d.title || d.doc_id }}
                    </div>
                    <div v-if="d.uploaded_at" class="text-[11px] text-zinc-500">
                      {{ d.uploaded_at }}
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <!-- 기존 문서 목록 li 내부 버튼 영역 옆에 추가 -->
                    <button
                      type="button"
                      class="text-xs px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700"
                      @click="goChunks(d)"
                      title="이 문서의 모든 청크 보기"
                    >
                      <Icon
                        name="material-symbols:pageview"
                        class="w-4 h-4"
                      ></Icon>
                    </button>

                    <!-- 원문 열기: 항상 변환된 PDF 뷰어로 연다 -->
                    <button
                      type="button"
                      class="text-xs px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700"
                      @click="openDoc(d)"
                      title="변환된 PDF 뷰어로 열기"
                    >
                      <Icon
                        name="material-symbols:picture-as-pdf-rounded"
                        class="w-4 h-4"
                      />
                    </button>
                    <!-- 원본 다운로드: 원본이 있을 때만 노출 -->
                    <button
                      v-if="d.original_key && !d.is_pdf_original"
                      type="button"
                      class="text-xs px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700"
                      @click="downloadOriginal(d)"
                      title="MinIO의 실제 원본 파일을 다운로드"
                    >
                      <Icon
                        name="material-symbols:download-rounded"
                        class="w-4 h-4"
                      />
                    </button>
                  </div>
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
          <!-- 답변 생성 중 로딩 버블 -->
          <div v-if="answering" class="flex">
            <!-- 어시스턴트 버블처럼 좌측 정렬 -->
            <div
              class="max-w-[80%] rounded-2xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 inline-flex items-center gap-2"
            >
              <Icon
                name="eos-icons:bubble-loading"
                class="w-6 h-6 animate-pulse"
              />
            </div>
          </div>
          <div ref="endRef" />
        </div>

        <div
          v-if="jobId && progress < 100"
          class="shrink-0 px-4 py-2 bg-zinc-900 border-t border-zinc-800"
        >
          <RagProgressBar :value="progress" label="인덱싱 진행률" />
        </div>
      </div>

      <!-- Input -->
      <div class="shrink-0">
        <RagInputBar
          :disabled="!canChat || answering"
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
import { generateId } from "~/utils/uuid";

const {
  uploadDocument, // 또는 uploadAndResolve 사용 가능
  getJobProgress,
  sendChat,
  listDocs,
  getStatus,
  getViewUrl,
  getDownloadUrl,
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

const router = useRouter();

function goChunks(d: DocItem) {
  docsOpen.value = false; // 토글 닫기
  router.push(`/chunks/${encodeURIComponent(d.doc_id)}`);
}

async function refreshStatusAndDocs() {
  try {
    const s = await getStatus();
    hasData.value = !!s.has_data;
  } catch {
    hasData.value = false;
  }
  try {
    docs.value = await listDocs();
  } catch {
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

// 외부 클릭 시 토글 닫기
function onGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest(".docs-toggle-area")) docsOpen.value = false;
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

// 업로드 → 진행률 폴링 → 완료 시 목록 갱신
watch(jobId, (val) => {
  if (!val) return;
  const timer = setInterval(async () => {
    try {
      const s = await getJobProgress(val);
      progress.value = s.progress ?? 0;
      blocking.value = (s.progress ?? 0) < 100;
      if (progress.value >= 100) {
        clearInterval(timer);
        await refreshStatusAndDocs();
      }
    } catch (e) {
      console.warn("progress error", e);
    }
  }, 1500);
});

function openDoc(d: DocItem) {
  const key = d.pdf_key || d.object_key || "";
  if (!key) return;
  const url = getViewUrl(key, d.title || `${d.doc_id}.pdf`);
  window.open(url, "_blank", "noopener,noreferrer");
}

function downloadOriginal(d: DocItem) {
  if (!d.original_key) return;
  const url = getDownloadUrl(
    d.original_key,
    d.original_name || d.title || d.doc_id
  );
  window.open(url, "_blank", "noopener,noreferrer");
}

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

const answering = ref(false);
watch(answering, () => scrollToEnd("smooth"));

const onSend = async (query: string) => {
  const userMsg: ChatMessage = {
    id: generateId(),
    role: "user",
    content: query,
    created_at: new Date().toISOString(),
  };
  messages.value = [...messages.value, userMsg];
  answering.value = true;
  try {
    const history = messages.value.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const { answer, sources } = await sendChat(history, query);
    const botMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: answer,
      created_at: new Date().toISOString(),
      sources,
    };
    messages.value = [...messages.value, botMsg];
  } catch (e: any) {
    const botMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: `오류가 발생했습니다. 관리자에게 문의해주세요.\n\n${
        e?.message || e
      }`,
      created_at: new Date().toISOString(),
    };
    messages.value = [...messages.value, botMsg];
  } finally {
    answering.value = false;
  }
};

function onInputResize(_h: number) {
  scrollToEnd("auto");
}
</script>
