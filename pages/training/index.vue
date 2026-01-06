<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <!-- 헤더: 제목 + 프로그레스 바 -->
      <div class="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
        <div class="flex items-center justify-between gap-6">
          <!-- 좌측: 제목 -->
          <div class="flex items-center gap-3">
            <div>
              <h1 class="text-2xl font-bold text-zinc-900">원자력 파일 학습</h1>
              <p class="text-sm text-zinc-500 mt-0.5 text-pretty">
                선택한 문서로 모델 파인튜닝
              </p>
            </div>
          </div>

          <!-- 우측: 프로그레스 바 -->
          <div v-if="currentJobId" class="flex-1 max-w-md">
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-zinc-600 font-medium">학습 진행률</span>
                <span
                  class="font-semibold"
                  :class="{
                    'text-zinc-400': trainingProgress === 0,
                    'text-blue-600':
                      trainingProgress > 0 && trainingProgress < 100,
                    'text-green-600': trainingProgress === 100,
                  }"
                >
                  {{ trainingProgress.toFixed(1) }}%
                </span>
              </div>
              <div class="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  class="h-full transition-all duration-500 ease-out rounded-full"
                  :class="{
                    'bg-gradient-to-r from-blue-500 to-indigo-600':
                      trainingProgress > 0 && trainingProgress < 100,
                    'bg-gradient-to-r from-green-500 to-emerald-600':
                      trainingProgress === 100,
                  }"
                  :style="{ width: `${trainingProgress}%` }"
                ></div>
              </div>
              <p v-if="currentStep" class="text-xs text-zinc-500 mt-1">
                {{ currentStep }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 메인 컨텐츠: 좌측 카테고리 (1/3) + 우측 문서 목록 (2/3) -->
      <div class="bg-white rounded-xl shadow-sm border border-zinc-200">
        <div class="flex h-[calc(100vh-280px)]">
          <!-- 좌측: 카테고리 선택 영역 (1/3) -->
          <div
            class="w-1/3 border-r border-zinc-200 flex flex-col overflow-hidden p-3 pr-0"
          >
            <KnowledgeMenu
              :selected-count="selectedDocIds.length"
              :selected-categories="selectedCategories"
              @category-selected="onCategorySelected"
              @select-all-knowledge="onSelectAllKnowledge"
            />
          </div>

          <!-- 우측: 문서 목록 영역 (2/3) -->
          <div class="flex-1 flex flex-col">
            <!-- 상단: 검색 & 선택 정보 -->
            <div class="p-6 pb-4 border-b border-zinc-200">
              <div class="flex items-center justify-between gap-4 mb-4">
                <!-- 검색바 -->
                <div class="flex-1 max-w-md">
                  <div class="relative">
                    <Icon
                      name="lucide:search"
                      class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
                    />
                    <input
                      v-model="docSearch"
                      type="text"
                      placeholder="문서 검색..."
                      class="w-full pl-9 pr-4 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <!-- 선택 정보 -->
                <div class="flex items-center gap-3">
                  <span class="text-sm text-zinc-600">
                    선택된 문서:
                    <span class="font-semibold text-slate-800">
                      {{ selectedDocIds.length }}
                    </span>
                    개
                  </span>
                </div>
              </div>

              <!-- 전체 선택 / 선택 초기화 버튼 -->
              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 text-xs rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  @click="selectAllDocs"
                  :disabled="filteredDocs.length === 0 || allDocsSelected"
                >
                  {{ allDocsSelected ? "✓ 전체 선택됨" : "전체 선택" }}
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 text-xs rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  @click="clearSelectedDocs"
                  :disabled="selectedDocIds.length === 0"
                >
                  선택 초기화
                </button>
              </div>
            </div>

            <!-- 문서 목록 (스크롤 가능) -->
            <div
              class="flex-1 overflow-y-auto p-6 pt-4 scrollbar-zinc"
              style="scrollbar-gutter: stable"
            >
              <!-- 문서 목록 -->
              <div v-if="paginatedDocs.length > 0" class="space-y-2">
                <div
                  v-for="doc in paginatedDocs"
                  :key="doc.doc_id"
                  class="group relative border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  :class="{
                    'ring-2 ring-slate-900 border-slate-900 bg-zinc-50':
                      isSelected(doc.doc_id),
                    'hover:border-zinc-300': !isSelected(doc.doc_id),
                  }"
                  @click="toggleSelection(doc.doc_id)"
                >
                  <div class="flex items-start gap-3">
                    <!-- 체크박스 -->
                    <div class="flex-shrink-0 mt-0.5">
                      <div
                        class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                        :class="{
                          'bg-slate-800 border-slate-800': isSelected(
                            doc.doc_id
                          ),
                          'bg-white border-zinc-300 group-hover:border-zinc-400':
                            !isSelected(doc.doc_id),
                        }"
                      >
                        <Icon
                          v-if="isSelected(doc.doc_id)"
                          name="lucide:check"
                          class="w-3 h-3 text-white"
                        />
                      </div>
                    </div>

                    <!-- 문서 정보 -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2">
                        <h3 class="text-sm font-semibold line-clamp-2">
                          {{ doc.title || doc.doc_id }}
                        </h3>
                      </div>

                      <!-- 메타정보 -->
                      <div
                        class="mt-2 flex items-center gap-3 text-xs text-zinc-400"
                      >
                        <div
                          v-if="doc.uploaded_at"
                          class="flex items-center gap-1.5"
                        >
                          <Icon name="lucide:calendar" class="w-3 h-3" />
                          <span>{{ formatDate(doc.uploaded_at) }}</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <NuxtLink
                            :to="`/chunks/${doc.doc_id}`"
                            class="text-xs border hover:text-zinc-700 font-medium inline-flex items-center gap-1.5"
                            @click.stop
                          >
                            <Icon name="lucide:file" class="w-3 h-3" />
                            <span class="truncate"
                              >{{ doc.chunk_count }}개의
                            </span>
                            청크 보기
                          </NuxtLink>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 문서 없음 -->
              <div
                v-else-if="!isLoading && filteredDocs.length === 0"
                class="text-center py-12"
              >
                <Icon
                  name="lucide:inbox"
                  class="w-16 h-16 text-zinc-300 mx-auto mb-3"
                />
                <p class="text-zinc-500">검색 결과가 없습니다</p>
              </div>

              <!-- 로딩 -->
              <div v-else-if="isLoading" class="text-center py-12">
                <Icon
                  name="eos-icons:bubble-loading"
                  class="w-12 h-12 text-slate-800 mx-auto mb-3 animate-pulse"
                />
                <p class="text-zinc-500">문서 목록을 불러오는 중...</p>
              </div>
            </div>

            <!-- 페이징 버튼 -->
            <div
              v-if="totalPages > 1"
              class="border-t border-zinc-200 text-zinc-600 p-2 flex items-center justify-center gap-2"
            >
              <button
                type="button"
                :disabled="currentPage === 1"
                class="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                @click="prevPage"
              >
                <Icon name="lucide:chevron-left" class="w-4 h-4" />
                이전
              </button>

              <div class="flex items-center gap-2">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  type="button"
                  class="w-8 h-8 text-sm rounded-lg transition-all"
                  :class="{
                    'bg-slate-900 text-white font-semibold':
                      page === currentPage,
                    'border border-zinc-300 hover:bg-zinc-50 text-zinc-700':
                      page !== currentPage,
                  }"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
              </div>

              <button
                type="button"
                :disabled="currentPage === totalPages"
                class="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                @click="nextPage"
              >
                다음
                <Icon name="lucide:chevron-right" class="w-4 h-4" />
              </button>
            </div>

            <!-- 하단: 학습하기 버튼 -->
            <div class="border-t border-zinc-200 p-6">
              <div class="flex justify-end">
                <button
                  type="button"
                  :disabled="selectedDocIds.length === 0 || isTraining"
                  class="px-8 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  :class="{
                    'bg-gradient-to-r from-indigo-900 to-slate-900 hover:from-blue-500 hover:to-indigo-600':
                      selectedDocIds.length > 0 && !isTraining,
                    'bg-zinc-400': selectedDocIds.length === 0 || isTraining,
                  }"
                  @click="startTraining"
                >
                  <Icon
                    :name="
                      isTraining ? 'eos-icons:bubble-loading' : 'lucide:play'
                    "
                    class="w-5 h-5"
                    :class="{ 'animate-pulse': isTraining }"
                  />
                  {{ isTraining ? "학습 진행 중..." : "학습하기" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 에러 메시지 -->
      <div
        v-if="errorMessage"
        class="bg-red-50 border border-red-200 rounded-lg p-4"
      >
        <div class="flex items-start gap-3">
          <Icon
            name="lucide:alert-circle"
            class="w-5 h-5 text-red-600 mt-0.5"
          />
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-red-900 mb-1">오류 발생</h3>
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
          </div>
          <button
            type="button"
            class="text-red-600 hover:text-red-700"
            @click="errorMessage = null"
          >
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from "vue";
import { useDocsList } from "@/composables/useDocsList";
import { useApi, type DocItem } from "@/composables/useApi";
import {
  useFinetuneApi,
  useFinetuningPolling,
} from "@/composables/useFinetuneApi";
import KnowledgeMenu from "@/components/Chat/KnowledgeMenu.vue";

// 문서 목록 가져오기
const { docs, hasData, isLoading, fetchDocs } = useDocsList();

// 카테고리 API
const { listDocsByCode } = useApi();

// 파인튜닝 API
const { startFinetuning } = useFinetuneApi();

// 검색 & 선택 상태
const docSearch = ref("");
const selectedDocIds = ref<string[]>([]);

// 학습 상태
const isTraining = ref(false);
const currentJobId = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

// 페이징 상태
const currentPage = ref(1);
const itemsPerPage = 10; // 리스트형 레이아웃에 맞게 조정

// 폴링 설정
const { status, progress, isCompleted, startPolling, stopPolling } =
  useFinetuningPolling(currentJobId.value || "", 2000);

// 진행률 및 현재 단계
const trainingProgress = computed(() => progress.value || 0);
const currentStep = computed(() => status.value?.current_step || "");

// 카테고리 맵핑 (chat/index.vue와 동일)
const docCategoryMap = ref<
  Map<string, { code: string; detail?: string; sub?: string }>
>(new Map());

// 선택된 카테고리 computed (chat/index.vue와 동일)
const selectedCategories = computed(() => {
  const categories = new Set<string>();
  const categoryDocCounts = new Map<string, Set<string>>();

  for (const docId of selectedDocIds.value) {
    const category = docCategoryMap.value.get(docId);
    if (!category) continue;

    const { code, detail, sub } = category;

    if (code && detail && sub) {
      categories.add(`${code}::${detail}::${sub}`);
    }

    // 카테고리별 선택된 문서 추적
    if (code) {
      if (!categoryDocCounts.has(code)) categoryDocCounts.set(code, new Set());
      categoryDocCounts.get(code)!.add(docId);
    }

    if (code && detail) {
      const detailKey = `${code}::${detail}`;
      if (!categoryDocCounts.has(detailKey))
        categoryDocCounts.set(detailKey, new Set());
      categoryDocCounts.get(detailKey)!.add(docId);
    }
  }

  // 전체 선택 여부 확인
  for (const [catKey, selectedDocs] of categoryDocCounts.entries()) {
    let totalCount = 0;
    const parts = catKey.split("::");

    for (const [docId, cat] of docCategoryMap.value.entries()) {
      if (parts.length === 1 && cat.code === parts[0]) {
        totalCount++;
      } else if (
        parts.length === 2 &&
        cat.code === parts[0] &&
        cat.detail === parts[1]
      ) {
        totalCount++;
      }
    }

    if (totalCount > 0 && selectedDocs.size === totalCount) {
      categories.add(catKey);
    }
  }

  return categories;
});

// docs watch (카테고리 맵 구축)
watch(
  docs,
  (newDocs) => {
    console.log("[Training] docs updated, count:", newDocs.length);
    const newMap = new Map();
    for (const doc of newDocs) {
      if (doc.data_code) {
        newMap.set(doc.doc_id, {
          code: doc.data_code,
          detail: doc.data_detail_code || undefined,
          sub: doc.data_sub_code || undefined,
        });
      }
    }
    console.log("[Training] docCategoryMap created, size:", newMap.size);
    docCategoryMap.value = newMap;
  },
  { immediate: true }
);

// 검색된 문서 리스트 (최신순 정렬)
const filteredDocs = computed(() => {
  const q = docSearch.value.trim().toLowerCase();
  let result = q
    ? docs.value.filter((d) => {
        const name = (d.title || d.doc_id || "").toLowerCase();
        return name.includes(q);
      })
    : docs.value.slice();

  // 최신순 정렬
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

// 보이는 페이지 번호 (최대 5개)
const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 2;

  let start = Math.max(1, current - delta);
  let end = Math.min(total, current + delta);

  if (end - start < delta * 2) {
    if (start === 1) {
      end = Math.min(total, start + delta * 2);
    } else if (end === total) {
      start = Math.max(1, end - delta * 2);
    }
  }

  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
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

const goToPage = (page: number) => {
  currentPage.value = page;
};

// 검색어 변경 시 첫 페이지로 리셋
watch(docSearch, () => {
  currentPage.value = 1;
});

// 문서 선택 토글
const toggleSelection = (docId: string) => {
  const index = selectedDocIds.value.indexOf(docId);
  if (index > -1) {
    selectedDocIds.value.splice(index, 1);
  } else {
    selectedDocIds.value.push(docId);
  }
};

// 선택 여부 확인
const isSelected = (docId: string) => {
  return selectedDocIds.value.includes(docId);
};

// 선택 해제
const clearSelection = () => {
  selectedDocIds.value = [];
};

// 전체 문서 선택됨 여부
const allDocsSelected = computed(() => {
  if (filteredDocs.value.length === 0) return false;
  return (
    filteredDocs.value.length === selectedDocIds.value.length &&
    filteredDocs.value.every((d) => selectedDocIds.value.includes(d.doc_id))
  );
});

// 전체 문서 선택
function selectAllDocs() {
  const allDocIds = filteredDocs.value.map((d) => d.doc_id);
  selectedDocIds.value = allDocIds;
  console.log(`[Training] Selected ALL ${allDocIds.length} documents`);
}

// 선택 초기화
function clearSelectedDocs() {
  selectedDocIds.value = [];
}

// 날짜 포맷팅
const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

// 카테고리 선택 핸들러
async function onCategorySelected(filter: {
  code?: string;
  detail?: string;
  sub?: string;
}) {
  console.log("[Training] Category selected:", filter);

  if (!filter.code && !filter.detail && !filter.sub) {
    return;
  }

  try {
    const docIds = await listDocsByCode({
      code: filter.code,
      detail: filter.detail,
      sub: filter.sub,
    });

    const uniq = Array.from(new Set(docIds));

    console.log("[Training] Selected docs:", uniq);

    if (uniq.length === 0) {
      console.log(`[Training] Empty category, skipping toggle`);
      return;
    }

    const current = new Set(selectedDocIds.value);
    const allSelected = uniq.every((id) => current.has(id));

    if (allSelected) {
      uniq.forEach((id) => current.delete(id));
    } else {
      uniq.forEach((id) => current.add(id));
    }

    selectedDocIds.value = Array.from(current);

    nextTick(() => {
      console.log("[Training] After selection:");
      console.log("  selectedDocIds:", selectedDocIds.value);
      console.log(
        "  selectedCategories:",
        Array.from(selectedCategories.value)
      );
    });
  } catch (e) {
    console.error("[Training] onCategorySelected failed:", e);
    alert("문서 카테고리 선택 중 오류가 발생했습니다.");
  }
}

// 지식저장소 전체 선택 핸들러
async function onSelectAllKnowledge() {
  console.log("[Training] Select ALL knowledge documents");

  try {
    const allThemeCodes = [
      "theme1",
      "theme2",
      "theme3",
      "theme4",
      "theme6",
      "theme7",
      "theme8",
      "theme9",
    ];

    const allDocIds: Set<string> = new Set();

    for (const themeCode of allThemeCodes) {
      try {
        const docIds = await listDocsByCode({ code: themeCode });
        docIds.forEach((id) => allDocIds.add(id));
      } catch (e) {
        console.warn(`[Training] Failed to fetch ${themeCode}:`, e);
      }
    }

    const uniqueIds = Array.from(allDocIds);

    const currentSelected = new Set(selectedDocIds.value);
    uniqueIds.forEach((id) => currentSelected.add(id));

    selectedDocIds.value = Array.from(currentSelected);

    console.log(
      `[Training] Selected ALL knowledge: ${uniqueIds.length} documents`
    );
  } catch (e) {
    console.error("[Training] onSelectAllKnowledge failed:", e);
    alert("지식저장소 전체 선택 중 오류가 발생했습니다.");
  }
}

// 학습 시작 (실제 API 호출)
const startTraining = async () => {
  if (selectedDocIds.value.length === 0) return;

  errorMessage.value = null;
  isTraining.value = true;

  try {
    console.log(
      `[FINETUNE] Starting training with ${selectedDocIds.value.length} documents`
    );

    // 파인튜닝 시작
    const response = await startFinetuning({
      doc_ids: selectedDocIds.value,
      model_name: "Qwen/Qwen2.5-14B-Instruct",
      lora_r: 16,
      lora_alpha: 32,
      num_epochs: 3,
      batch_size: 2,
      learning_rate: 2e-4,
    });

    console.log(`[FINETUNE] Job started: ${response.job_id}`);

    currentJobId.value = response.job_id;

    // 폴링 시작
    startPolling();
  } catch (error: any) {
    console.error("[FINETUNE] Error:", error);
    errorMessage.value =
      error.message || "파인튜닝 시작 중 오류가 발생했습니다";
    isTraining.value = false;
  }
};

// 완료 감지
watch(isCompleted, (completed) => {
  if (completed) {
    isTraining.value = false;

    if (status.value?.status === "completed") {
      alert(
        `파인튜닝이 완료되었습니다!\n출력 경로: ${status.value.output_path}`
      );
    } else if (status.value?.status === "failed") {
      errorMessage.value = status.value.error || "파인튜닝 실패";
    }
  }
});

// 초기 데이터 로드
fetchDocs();

// Cleanup
onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.scrollbar-zinc::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-zinc::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-zinc::-webkit-scrollbar-thumb {
  background: #d4d4d8;
  border-radius: 3px;
}

.scrollbar-zinc::-webkit-scrollbar-thumb:hover {
  background: #a1a1aa;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
