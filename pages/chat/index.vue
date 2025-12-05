<template>
  <div
    class="h-screen w-full bg-zinc-100 text-zinc-950 flex relative overflow-hidden"
  >
    <!-- 🔹 중앙 워터마크 배경 레이어
    <div
      v-if="bgImage"
      class="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
      aria-hidden="true"
    >
      <div class="relative" style="width: 50vw; height: 50vh">
        <img
          :src="bgImage"
          alt=""
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40 select-none object-contain w-full h-full"
          draggable="false"
        />
      </div>
    </div> -->
    <!-- 🔹 왼쪽 문서 목록 영역 (30%) -->
    <div
      class="w-[30%] min-w-[260px] max-w-sm border-r border-zinc-200 bg-white flex flex-col"
    >
      <!-- 🔹 새로 추가: 세션 관리 영역 -->
      <div class="p-3 border-b border-zinc-200 bg-zinc-50 flex-shrink-0">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-zinc-600">대화 기록</span>
          <button
            type="button"
            class="px-2 py-1 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800"
            @click="createNewSession"
          >
            + 새 대화
          </button>
        </div>

        <!-- 세션 목록 -->
        <div class="space-y-1 max-h-32 overflow-y-auto scrollbar-zinc">
          <div
            v-for="session in sortedSessions"
            :key="session.id"
            :class="[
              'px-2 py-1.5 text-xs rounded cursor-pointer flex items-center justify-between',
              session.id === currentSessionId
                ? 'bg-slate-900 text-white'
                : 'bg-zinc-100 hover:bg-zinc-200',
            ]"
            @click="switchToSession(session.id)"
          >
            <span class="truncate flex-1">
              {{ getSessionTitle(session) }}
            </span>
            <button
              type="button"
              class="ml-2 text-zinc-400 hover:text-zinc-200"
              @click.stop="confirmDeleteSession(session.id)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- 선택된 문서 태그 + 검색창 -->
      <div class="p-3 py-2 border-b border-zinc-200 bg-zinc-50 flex-shrink-0">
        <!-- 선택된 문서 태그 -->
        <div
          v-if="selectedDocs.length"
          class="mb-2 pr-0 max-h-[130px] min-h-[105px] overflow-y-auto scrollbar-zinc gap-2"
          style="scrollbar-gutter: stable"
        >
          <div
            v-for="d in selectedDocs"
            :key="d.doc_id"
            class="inline-flex items-center max-w-full px-3 py-1 rounded-full bg-zinc-900/5 border border-zinc-300 text-xs"
          >
            <span class="truncate max-w-[250px]">
              {{ d.title || d.doc_id }}
            </span>
            <button
              type="button"
              class="ml-1 text-zinc-500 hover:text-zinc-800 max-h"
              @click.stop="toggleSelect(d.doc_id)"
              title="선택 해제"
            >
              ✕
            </button>
          </div>
        </div>
        <div
          v-else
          class="mb-2 min-h-[105px] text-xs text-zinc-400 items-center flex justify-center"
        >
          전체 문서에서 검색합니다.
        </div>
        <!-- 검색창 -->
        <div class="relative">
          <Icon
            name="lucide:search"
            class="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            v-model="docSearch"
            type="text"
            placeholder="문서 검색..."
            class="w-full pl-8 pr-3 py-2 rounded-full border border-zinc-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>
      </div>

      <!--  문서 리스트 (페이징) -->
      <div class="flex-shrink-0">
        <div class="p-3 pr-1 space-y-1">
          <div
            v-if="!paginatedDocs.length"
            class="text-xs text-zinc-400 text-center py-4"
          >
            표시할 문서가 없습니다.
          </div>

          <div
            v-for="d in paginatedDocs"
            :key="d.doc_id"
            class="rounded-lg border border-transparent hover:border-zinc-300 hover:bg-zinc-50 px-2 py-1.5 flex items-center gap-2 cursor-pointer"
          >
            <!-- 체크박스 -->
            <input
              type="checkbox"
              class="doc-checkbox accent-slate-900"
              :value="d.doc_id"
              v-model="selectedDocIds"
              @click.stop
            />

            <!-- 제목/정보 -->
            <div class="flex-1 min-w-0" @click="goChunks(d)">
              <div class="text-xs font-medium truncate">
                {{ d.title || d.doc_id }}
              </div>
              <div
                v-if="d.uploaded_at"
                class="text-[11px] text-zinc-400 truncate"
              >
                {{ formatKST(d.uploaded_at) }}
              </div>
            </div>

            <!-- PDF 아이콘 -->
            <button
              v-if="d.pdf_key"
              type="button"
              class="shrink-0 text-zinc-400 hover:text-zinc-700"
              @click.stop="openDoc(d)"
              title="PDF로 보기"
            >
              <Icon
                name="material-symbols:picture-as-pdf-rounded"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>

        <!--  페이징 컨트롤 -->
        <div
          v-if="totalPages > 1"
          class="px-3 pb-3 flex items-center justify-center gap-2"
        >
          <button
            type="button"
            :disabled="currentPage === 1"
            class="p-1 rounded hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            @click="prevPage"
          >
            <Icon name="lucide:chevron-left" class="w-4 h-4" />
          </button>
          <span class="text-xs text-zinc-600 flex items-center">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            type="button"
            :disabled="currentPage === totalPages"
            class="p-1 rounded hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            @click="nextPage"
          >
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
      <KnowledgeMenu />
    </div>
    <!--  오른쪽 채팅 영역 (70%) -->
    <!--  기존 내용 그대로 -->
    <div class="flex-1 min-h-0 max-w-5xl mx-auto flex flex-col relative z-10">
      <!-- Header -->
      <!-- <div
        class="px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950/80 backdrop-blur z-20"
      >
        <div class="flex items-center justify-between">
          <div class="text-lg font-semibold"></div> -->

      <!-- 우측 상태/토글 -->
      <!-- <div class="relative text-xs text-zinc-400 docs-toggle-area"> -->
      <!-- 문서가 있을 때 -->
      <!-- <div v-if="hasData" class="inline-flex items-center gap-2"> -->
      <!-- <button
                type="button"
                class="inline-flex items-center px-2 py-1 rounded-md hover:bg-zinc-800/60"
                @click="toggleDocs"
              >
                문서 {{ docs.length }}개 ▾
              </button> -->

      <!-- <button
                type="button"
                class="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-zinc-800/60"
                @click.stop="refreshDocs"
                title="문서 목록 새로고침"
              >
                <Icon name="mynaui:refresh-alt" class="w-4 h-4" />
              </button>
            </div> -->

      <!-- 문서가 없을 때 -->
      <!-- <div v-else class="inline-flex items-center gap-2">
              <span class="text-zinc-400 leading-none">문서가 없습니다</span>
              <button
                type="button"
                class="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-zinc-800/60"
                @click="refreshDocs"
                title="문서 목록 새로고침"
              >
                <Icon name="mynaui:refresh-alt" class="w-4 h-4" />
              </button>
            </div> -->
      <!-- 토글 목록 -->
      <!-- <div
              v-if="docsOpen"
              class="absolute right-0 mt-2 w-[26rem] max-h-[11.2rem] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/95 shadow-lg p-2 scrollbar-zinc z-30"
            >
              <div
                v-if="!docs.length"
                class="px-3 py-6 text-center text-zinc-400"
              >
                목록이 비어 있습니다.
              </div>

              <ul v-else class="space-y-1">
                <li
                  v-for="d in docs"
                  :key="d.doc_id"
                  class="px-3 py-2 rounded-lg hover:bg-zinc-800/60 cursor-pointer transition group flex items-center gap-2"
                >
                  <div class="flex-1 min-w-0" @click="openDoc(d)">
                    <div class="text-sm font-medium truncate text-zinc-200">
                      {{ d.title || d.doc_id }}
                    </div>
                    <div
                      v-if="d.uploaded_at"
                      class="text-xs text-zinc-500 truncate"
                    >
                      {{ formatKST(d.uploaded_at) }}
                    </div>
                  </div>
                  <button
                    v-if="d.original_key"
                    type="button"
                    class="shrink-0 px-2 py-1 text-xs rounded-md bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 transition"
                    @click.stop="downloadOriginal(d)"
                    title="원본 다운로드"
                  >
                    다운로드
                  </button>
                </li>
              </ul>
            </div> -->
      <!-- </div>  -->
      <!-- </div>
      </div> -->
      <!-- Body: only chat scrolls -->
      <div class="flex-1 min-h-0 flex flex-col">
        <!-- 메시지가 없을 때 환영 메시지 표시 -->
        <div
          v-if="displayMessages.length === 0"
          class="flex-1 min-h-0 grid place-items-center p-6"
        >
          <!-- <div class="w-full max-w-xl space-y-6 text-center">
            <div class="text-3xl font-bold mb-4">한국원자력통제기술원</div>
            <div class="text-lg font-semibold text-slate-600 mb-6">
              키나기 Chat에 오신 것을 환영합니다
            </div>
          </div> -->
        </div>

        <!-- Chat list -->
        <div
          v-else
          ref="chatScroller"
          class="flex-1 min-h-0 overflow-y-auto space-y-4 p-4 scrollbar-zinc"
          style="scrollbar-gutter: stable"
        >
          <RagMessageBubble v-for="m in displayMessages" :key="m.id" :msg="m" />
          <!-- 답변 생성 중 로딩 버블 -->
          <div v-if="answering" class="flex">
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
      </div>

      <!-- Input -->
      <div class="shrink-0">
        <RagInputBar
          ref="inputBarRef"
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
// 🔹 새로 추가: ChatStore import
import { useChatStore } from "@/composables/useChatStore";

import RagUploadCenter from "@/components/Chat/UploadCenter.vue";
import RagProgressBar from "~/components/Chat/ProgressBar.vue";
import RagMessageBubble from "@/components/Chat/MessageBubble.vue";
import RagInputBar from "@/components/Chat/InputBar.vue";
import { generateId } from "~/utils/uuid";
import { formatKST } from "~/utils/datetime";
import bgPng from "~/assets/img/ic_floating_chat.png";
import KnowledgeMenu from "~/components/Chat/KnowledgeMenu.vue";
const { sendChat, listDocs, getStatus, getViewUrl, getDownloadUrl } = useApi();

const messages = ref<ChatMessage[]>([]);
const bgImage = ref(bgPng);

const chatStore = useChatStore();

const displayMessages = computed(() => {
  return chatStore.messages.value.length > 0
    ? chatStore.messages.value
    : messages.value;
});

const currentSessionId = computed(() => chatStore.currentSessionId.value);

const sortedSessions = computed(() => {
  return Array.from(chatStore.sessions.value.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
});

//  세션 제목 생성
const getSessionTitle = (session: any) => {
  if (session.messages.length > 0) {
    return session.messages[0].content.slice(0, 30) + "...";
  }
  return "새 대화";
};

// ===== 문서 목록/상태 =====
const hasData = ref(false);
const docsOpen = ref(false);
const docs = ref<DocItem[]>([]);

const router = useRouter();

// InputBar ref 추가
const inputBarRef = ref<InstanceType<typeof RagInputBar> | null>(null);

// 문서 검색 & 선택 상태
const docSearch = ref("");
const selectedDocIds = ref<string[]>([]);
const currentPage = ref(1);
const itemsPerPage = 5;

// 검색된 문서 리스트 (필터링 + 최신순 정렬)
const filteredDocs = computed(() => {
  const q = docSearch.value.trim().toLowerCase();
  let result = q
    ? docs.value.filter((d) => {
        const name = (d.title || d.doc_id || "").toLowerCase();
        return name.includes(q);
      })
    : docs.value.slice(); // 원본 배열 복사

  //  최신순 정렬 (uploaded_at 기준)
  result.sort((a, b) => {
    // uploaded_at이 있으면 날짜 비교
    if (a.uploaded_at && b.uploaded_at) {
      return (
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
    }
    // 날짜 없으면 뒤로 보내기
    if (a.uploaded_at && !b.uploaded_at) return -1;
    if (!a.uploaded_at && b.uploaded_at) return 1;

    // 둘 다 없으면 제목 알파벳순
    return (a.title || a.doc_id || "").localeCompare(b.title || b.doc_id || "");
  });

  return result;
});

const totalPages = computed(() => {
  return Math.ceil(filteredDocs.value.length / itemsPerPage);
});

const paginatedDocs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredDocs.value.slice(start, end);
});

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

watch(docSearch, () => {
  currentPage.value = 1;
});

// 선택된 문서 객체 리스트 (태그용)
const selectedDocs = computed(() =>
  docs.value.filter((d) => selectedDocIds.value.includes(d.doc_id))
);

// 태그에서 X 눌렀을 때
function toggleSelect(docId: string) {
  const idx = selectedDocIds.value.indexOf(docId);
  if (idx >= 0) {
    selectedDocIds.value.splice(idx, 1);
  } else {
    selectedDocIds.value.push(docId);
  }
}

function goChunks(d: DocItem) {
  docsOpen.value = false;
  router.push(`/chunks/${encodeURIComponent(d.doc_id)}`);
}

async function refreshStatusAndDocs() {
  try {
    const s = await getStatus();
    hasData.value = s.has_data;
  } catch {
    hasData.value = false;
  }
  try {
    const newDocs = await listDocs();
    docs.value = newDocs;
    hasData.value = newDocs.length > 0;
  } catch {
    docs.value = [];
    hasData.value = false;
  }
}

// 새로고침 버튼용
async function refreshDocs() {
  await refreshStatusAndDocs();
}

// 토글 버튼용
async function toggleDocs() {
  if (!docsOpen.value) {
    // 열 때마다 최신 목록 갱신
    await refreshStatusAndDocs();
  }
  docsOpen.value = !docsOpen.value;
}

onMounted(() => {
  refreshStatusAndDocs();
  window.addEventListener("click", onGlobalClick);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", onGlobalClick);
});

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

watch(displayMessages, () => scrollToEnd("smooth"));

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

const canChat = computed(() => hasData.value);

const answering = ref(false);
watch(answering, async (isAnswering) => {
  scrollToEnd("smooth");

  // 답변이 완료되면(false로 바뀌면) 입력창에 자동 포커스
  if (!isAnswering) {
    await nextTick();
    inputBarRef.value?.focus();
  }
});

const createNewSession = () => {
  chatStore.createSession();
  scrollToEnd("auto");
};

const switchToSession = (sessionId: string) => {
  chatStore.switchSession(sessionId);
  scrollToEnd("auto");
};

const confirmDeleteSession = (sessionId: string) => {
  if (confirm("이 대화를 삭제하시겠습니까?")) {
    chatStore.deleteSession(sessionId);
  }
};

//  메시지 전송 시 Store에도 저장
const onSend = async (query: string) => {
  const userMsg: ChatMessage = {
    id: generateId(),
    role: "user",
    content: query,
    created_at: new Date().toISOString(),
  };

  messages.value = [...messages.value, userMsg];

  chatStore.addMessage(userMsg);

  answering.value = true;
  try {
    const history = displayMessages.value.map((m) => ({
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

    chatStore.addMessage(botMsg);
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

    chatStore.addMessage(botMsg);
  } finally {
    answering.value = false;
  }
};

function onInputResize(_h: number) {
  scrollToEnd("auto");
}
</script>
<style scoped>
.chat_ico {
  width: 80px;
  height: 80px;
  background: #fff;
  border: 1px solid #ccc;
  margin-right: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chat_ico img {
  width: 60%;
}
.chat_input_area {
  position: relative;
  display: flex;
}
.chat_input_area textarea {
  width: 100%;
  border: 2px solid #4263f1;
  border-radius: 2rem;
  line-height: 3rem;
  padding: 0 1rem;
}
.chat_input_area button {
  position: absolute;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  background: #4263f1;
  right: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.doc-checkbox {
  width: 15px;
  height: 15px;
}
</style>
