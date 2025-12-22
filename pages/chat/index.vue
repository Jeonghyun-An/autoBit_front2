<template>
  <div
    class="h-screen w-full bg-zinc-100 text-zinc-950 flex relative overflow-hidden"
  >
    <!--  중앙 워터마크 배경 레이어
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
    <!--  왼쪽 문서 목록 영역 (30%) -->
    <div
      class="w-[30%] min-w-[260px] max-w-sm border-r border-zinc-200 bg-white flex flex-col relative"
    >
      <!--  세션 관리 영역 -->
      <div
        class="p-3 pr-0 pb-2 border-b border-zinc-200 bg-zinc-50 flex-shrink-0"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-zinc-600">대화 기록</span>
          <button
            type="button"
            class="px-2 py-1 mr-3 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800"
            @click="createNewSession"
          >
            + 새 대화
          </button>
        </div>

        <!-- 세션 목록 -->
        <div
          class="space-y-1 max-h-32 overflow-y-auto scrollbar-zinc"
          style="scrollbar-gutter: stable"
        >
          <div
            v-for="session in sortedSessions"
            :key="session.id"
            :class="[
              'px-2 py-1.5 text-xs rounded cursor-pointer flex items-center justify-between outline-none',
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
      <!-- <div class="p-3 py-2 border-b border-zinc-200 bg-zinc-50 flex-shrink-0"> -->
      <!-- 선택된 문서 태그 -->
      <!--
          <div
            v-if="selectedDocs.length"
            class="mb-2 pr-0 max-h-[135px] min-h-[110px] overflow-y-auto scrollbar-zinc gap-2"
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
            class="mb-2 min-h-[110px] text-xs text-zinc-400 items-center flex justify-center"
          >
            전체 문서에서 검색합니다.
          </div>
        -->
      <!-- 검색창 -->
      <!-- <div class="relative">
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
        </div> -->
      <!-- </div> -->

      <!--  문서 리스트 (페이징) -->
      <div class="flex-shrink-0">
        <div class="p-2 pb-1 pr-1 space-y-1">
          <!-- 선택 개수 + 초기화 버튼 -->
          <div class="flex items-center justify-between mb-1">
            <span class="text-[11px] text-zinc-500">
              선택된 문서
              <span class="font-semibold text-slate-800">{{
                selectedDocIds.length
              }}</span
              >개
            </span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="px-2 py-1 text-[10px] rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                @click="selectAllDocs"
                :disabled="filteredDocs.length === 0 || allDocsSelected"
              >
                {{ allDocsSelected ? "✓ 전체 선택됨" : "전체 선택" }}
              </button>
              <button
                type="button"
                class="px-2 py-1 text-[10px] rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                @click="clearSelectedDocs"
                :disabled="selectedDocIds.length === 0"
              >
                선택 초기화
              </button>
            </div>
          </div>
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
          class="px-3 pb-1 flex items-center justify-center gap-2"
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

      <!--  문서 카테고리 아코디언 (KnowledgeMenu) -->
      <KnowledgeMenu
        :selected-count="selectedDocIds.length"
        @category-selected="onCategorySelected"
        @select-all-knowledge="onSelectAllKnowledge"
      />
    </div>

    <!--  오른쪽 채팅 영역 (70%) -->
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
          class="flex-1 min-h-0 overflow-y-auto p-4 scrollbar-zinc"
          style="scrollbar-gutter: stable"
        >
          <RagMessageBubble
            v-for="m in displayMessages"
            :key="m.id"
            :msg="m"
            class="mb-4"
          />
          <!-- 답변 생성 중 로딩 버블 -->
          <div v-if="answering" class="flex w-full justify-start items-start">
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
import { useRouter } from "vue-router";
import { useApi, type ChatMessage, type DocItem } from "@/composables/useApi";
import { useChatStore } from "@/composables/useChatStore";
import { useDocsList } from "@/composables/useDocsList";

import RagMessageBubble from "@/components/Chat/MessageBubble.vue";
import RagInputBar from "@/components/Chat/InputBar.vue";
import KnowledgeMenu from "@/components/Chat/KnowledgeMenu.vue";

import { generateId } from "~/utils/uuid";
import { formatKST } from "~/utils/datetime";
import bgPng from "~/assets/img/ic_floating_chat.png";

//  listDocsByCode 추가 (getMetaByDocId 제거)
const { sendChat, getViewUrl, getDownloadUrl, listDocsByCode } = useApi();
const { docs, hasData, isLoading, fetchDocs } = useDocsList();
// const messages = ref<ChatMessage[]>([]);
const bgImage = ref(bgPng);
const chatStore = useChatStore();
const router = useRouter();

// 표시용 메시지 (Store 우선)
const displayMessages = computed(() => {
  return chatStore.currentSession.value?.messages ?? [];
});

// 현재 세션 ID
const currentSessionId = computed(() => chatStore.currentSessionId.value);

// 세션 목록 정렬
const sortedSessions = computed(() => {
  return Array.from(chatStore.sessions.value.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
});

// 세션 제목 생성
const getSessionTitle = (session: any) => {
  if (session.messages.length > 0) {
    return session.messages[0].content.slice(0, 30) + "...";
  }
  return "새 대화";
};

// InputBar ref
const inputBarRef = ref<InstanceType<typeof RagInputBar> | null>(null);

// 문서 검색 & 선택 상태
const docSearch = ref("");
// 로컬 ref 대신 store랑 바로 연결
const selectedDocIds = computed({
  get: () => chatStore.selectedDocIds.value,
  set: (val: string[]) => chatStore.setSelectedDocs(val),
});
const currentPage = ref(1);
const itemsPerPage = 5;

/**
 * filteredDocs:
 * - 기본: 전체 docs
 * - 검색어 있으면 제목/ID 기준 필터
 * - 카테고리 선택과는 무관 (카테고리는 선택 상태만 제어)
 */
const filteredDocs = computed(() => {
  const q = docSearch.value.trim().toLowerCase();

  let result = docs.value.slice();

  if (q) {
    result = result.filter((d) => {
      const name = (d.title || d.doc_id || "").toLowerCase();
      return name.includes(q);
    });
  }

  // 정렬 (업로드 최신순 → 제목순)
  result.sort((a, b) => {
    if (a.uploaded_at && b.uploaded_at) {
      return (
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
    }
    if (a.uploaded_at && !b.uploaded_at) return -1;
    if (!a.uploaded_at && b.uploaded_at) return 1;
    return (a.title || a.doc_id || "").localeCompare(b.title || b.doc_id || "");
  });

  return result;
});

// 전체 페이지 수
const totalPages = computed(() => {
  return Math.ceil(filteredDocs.value.length / itemsPerPage);
});

// 현재 페이지의 문서 목록
const paginatedDocs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredDocs.value.slice(start, end);
});

// 페이지 이동 함수
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

// 검색어 변경 시 첫 페이지로 리셋
watch(docSearch, () => {
  currentPage.value = 1;
});

// 선택된 문서 객체 리스트 (태그용)
const selectedDocs = computed(() =>
  docs.value.filter((d) => selectedDocIds.value.includes(d.doc_id))
);

// 태그에서 X 눌렀을 때
function toggleSelect(docId: string) {
  chatStore.toggleSelectedDoc(docId);
}
// docs.value 기준 (전체 문서)
const allDocsSelected = computed(() => {
  if (docs.value.length === 0) return false;

  return (
    docs.value.length === selectedDocIds.value.length &&
    docs.value.every((d) => selectedDocIds.value.includes(d.doc_id))
  );
});

// 전체 문서 선택
function selectAllDocs() {
  const allDocIds = docs.value.map((d) => d.doc_id);
  chatStore.setSelectedDocs(allDocIds);

  console.log(`[Chat] Selected ALL ${allDocIds.length} documents`);
}
// 선택 초기화 버튼
function clearSelectedDocs() {
  chatStore.setSelectedDocs([]);
}

function goChunks(d: DocItem) {
  router.push(`/chunks/${encodeURIComponent(d.doc_id)}`);
}
// 지식저장소 전체 선택 핸들러
async function onSelectAllKnowledge() {
  console.log("[Chat] Select ALL knowledge documents");

  try {
    // 모든 테마 코드
    const allThemeCodes = [
      "theme1", // 협정 및 법령
      "theme2", // IAEA 문서
      "theme3", // 국제기구 문서
      "theme4", // KINAC 자료
      "theme6", // 타국 규제정보
      "theme7", // 주요국 규제정보
      "theme8", // 기술동향
      "theme9", // KINAC 대외협력
    ];

    // 모든 테마의 문서 ID 수집
    const allDocIds: Set<string> = new Set();

    for (const themeCode of allThemeCodes) {
      try {
        const docIds = await listDocsByCode({ code: themeCode });
        docIds.forEach((id) => allDocIds.add(id));
      } catch (e) {
        console.warn(`[Chat] Failed to fetch ${themeCode}:`, e);
      }
    }

    const uniqueIds = Array.from(allDocIds);

    // 기존 선택 + 새로운 문서들
    const currentSelected = new Set(selectedDocIds.value);
    uniqueIds.forEach((id) => currentSelected.add(id));

    chatStore.setSelectedDocs(Array.from(currentSelected));

    console.log(`[Chat] Selected ALL knowledge: ${uniqueIds.length} documents`);
  } catch (e) {
    console.error("[Chat] onSelectAllKnowledge failed:", e);
    alert("지식저장소 전체 선택 중 오류가 발생했습니다.");
  }
}

/**
 * 카테고리 선택:
 * - 백엔드에서 해당 카테고리 doc_ids 가져옴
 * - 그 doc_ids에 대해 "토글 선택"만 수행
 * - 리스트/검색에는 전혀 영향 X (항상 전체 docs 기준)
 */
async function onCategorySelected(filter: {
  code?: string;
  detail?: string;
  sub?: string;
}) {
  console.log("[Chat] Category selected:", filter);

  // 필터 정보가 없으면 아무 것도 안 함 (여기서 전체 해제 로직 넣을 수도 있음)
  if (!filter.code && !filter.detail && !filter.sub) {
    // 선택만 싹 지우고 싶으면:
    // chatStore.setSelectedDocs([]);
    return;
  }

  try {
    const docIds = await listDocsByCode({
      code: filter.code,
      detail: filter.detail,
      sub: filter.sub,
    });

    const uniq = Array.from(new Set(docIds));
    const current = new Set(selectedDocIds.value);

    // 카테고리에 속한 문서가 모두 이미 선택되어 있으면 → 해제
    const allSelected = uniq.length > 0 && uniq.every((id) => current.has(id));

    if (allSelected) {
      // 이미 다 선택되어 있으면 해당 카테고리 문서만 해제
      uniq.forEach((id) => current.delete(id));
    } else {
      // 일부라도 안 선택되어 있으면 카테고리 문서 전체 선택
      uniq.forEach((id) => current.add(id));
    }
    chatStore.setSelectedDocs(Array.from(current));

    console.log(
      `[Chat] Category toggle: ${uniq.length} docs, allSelected=${allSelected}`
    );
  } catch (e) {
    console.error("[Chat] onCategorySelected failed:", e);
    alert("문서 카테고리 선택 중 오류가 발생했습니다.");
  }
}

//  onMounted - 메타 프리로드 제거
onMounted(async () => {
  await fetchDocs();
  window.addEventListener("click", onGlobalClick);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", onGlobalClick);
});

function onGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest(".docs-toggle-area")) {
    // docsOpen 관련 코드가 있다면
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

// displayMessages 감시
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

  if (!isAnswering) {
    await nextTick();
    inputBarRef.value?.focus();
  }
});

// 세션 관리 함수들
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

const onSend = async (
  query: string,
  responseType: "short" | "long" | "ultra_long" = "short"
) => {
  // 1) 보내는 시점의 세션 ID를 고정
  const sessionIdAtSend = chatStore.currentSessionId.value;
  if (!sessionIdAtSend) return;

  const userMsg: ChatMessage = {
    id: generateId(),
    role: "user",
    content: query,
    created_at: new Date().toISOString(),
  };

  // 2) 질문은 “그 시점 세션”에만 쌓기
  chatStore.addMessageToSession(sessionIdAtSend, userMsg);

  answering.value = true;
  try {
    // history도 해당 세션 기준으로
    const sessionAtSend = chatStore.sessions.value.get(sessionIdAtSend);
    const history = (sessionAtSend?.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const { answer, sources } = await sendChat(
      history,
      query,
      selectedDocIds.value.length > 0 ? selectedDocIds.value : undefined,
      responseType
    );

    const botMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: answer,
      created_at: new Date().toISOString(),
      sources,
    };

    // 3) 응답도 “질문 보냈던 세션”에만 추가
    chatStore.addMessageToSession(sessionIdAtSend, botMsg);
  } catch (e: any) {
    const botMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: `오류가 발생했습니다. 관리자에게 문의해주세요.\n\n${
        e?.message || e
      }`,
      created_at: new Date().toISOString(),
    };

    chatStore.addMessageToSession(sessionIdAtSend, botMsg);
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
