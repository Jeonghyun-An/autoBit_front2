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
              <p class="text-sm text-zinc-500 mt-0.5">
                선택한 문서로 모델 파인튜닝
              </p>
            </div>
          </div>

          <!-- 우측: 프로그레스 바 -->
          <div class="flex-1 max-w-md">
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
                  {{ trainingProgress }}%
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
            </div>
          </div>
        </div>
      </div>

      <!-- 컨텐츠 영역 -->
      <div class="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
        <!-- 상단: 검색 & 선택 정보 -->
        <div class="flex items-center justify-between gap-4 mb-6">
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
              <span class="font-semibold text-blue-600">
                {{ selectedDocIds.length }}
              </span>
              개
            </span>
            <button
              v-if="selectedDocIds.length > 0"
              type="button"
              class="text-sm text-red-600 hover:text-red-700 font-medium"
              @click="clearSelection"
            >
              선택 해제
            </button>
          </div>
        </div>

        <!-- 3x3 그리드: 문서 카드 -->
        <div
          v-if="paginatedDocs.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
        >
          <div
            v-for="doc in paginatedDocs"
            :key="doc.doc_id"
            class="group relative border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
            :class="{
              'ring-2 ring-blue-500 border-blue-500 bg-blue-50': isSelected(
                doc.doc_id
              ),
              'hover:border-zinc-300': !isSelected(doc.doc_id),
            }"
            @click="toggleSelection(doc.doc_id)"
          >
            <!-- 선택 체크박스 -->
            <div class="absolute top-3 right-3">
              <div
                class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                :class="{
                  'bg-blue-500 border-blue-500': isSelected(doc.doc_id),
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

            <!-- 문서 아이콘 -->
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
              :class="{
                'bg-blue-100': isSelected(doc.doc_id),
                'bg-zinc-100': !isSelected(doc.doc_id),
              }"
            >
              <Icon
                name="lucide:file-text"
                class="w-6 h-6"
                :class="{
                  'text-blue-600': isSelected(doc.doc_id),
                  'text-zinc-600': !isSelected(doc.doc_id),
                }"
              />
            </div>

            <!-- 문서 제목 -->
            <h3
              class="text-sm font-semibold mb-2 line-clamp-2"
              :class="{
                'text-blue-900': isSelected(doc.doc_id),
                'text-zinc-900': !isSelected(doc.doc_id),
              }"
            >
              {{ doc.title || doc.doc_id }}
            </h3>

            <!-- 메타정보 -->
            <div class="space-y-1 text-xs text-zinc-500">
              <div v-if="doc.uploaded_at" class="flex items-center gap-1.5">
                <Icon name="lucide:calendar" class="w-3 h-3" />
                <span>{{ formatDate(doc.uploaded_at) }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Icon name="lucide:file" class="w-3 h-3" />
                <span class="truncate">{{ doc.doc_id }}</span>
              </div>
            </div>

            <!-- 청크 보기 버튼 -->
            <div class="mt-3 pt-3 border-t border-zinc-200">
              <NuxtLink
                :to="`/rag/chunks/${doc.doc_id}`"
                class="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                @click.stop
              >
                <Icon name="lucide:list" class="w-3 h-3" />
                청크 보기
              </NuxtLink>
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
            class="w-12 h-12 text-blue-500 mx-auto mb-3 animate-pulse"
          />
          <p class="text-zinc-500">문서 목록을 불러오는 중...</p>
        </div>

        <!-- 페이징 버튼 -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-center gap-2 pt-4 border-t border-zinc-200"
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
                'bg-blue-500 text-white font-semibold': page === currentPage,
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
        <div class="flex justify-end pt-6 border-t border-zinc-200 mt-6">
          <button
            type="button"
            :disabled="selectedDocIds.length === 0 || isTraining"
            class="px-8 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            :class="{
              'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700':
                selectedDocIds.length > 0 && !isTraining,
              'bg-zinc-400': selectedDocIds.length === 0 || isTraining,
            }"
            @click="startTraining"
          >
            <Icon
              :name="isTraining ? 'eos-icons:bubble-loading' : 'lucide:play'"
              class="w-5 h-5"
              :class="{ 'animate-pulse': isTraining }"
            />
            {{ isTraining ? "학습 진행 중..." : "학습하기" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useDocsList } from "@/composables/useDocsList";

// 문서 목록 가져오기
const { docs, hasData, isLoading, fetchDocs } = useDocsList();

// 검색 & 선택 상태
const docSearch = ref("");
const selectedDocIds = ref<string[]>([]);

// 학습 상태
const isTraining = ref(false);
const trainingProgress = ref(0);

// 페이징 상태
const currentPage = ref(1);
const itemsPerPage = 9; // 3x3 그리드

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

  // 좌우 균형 맞추기
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

// 학습 시작 (시뮬레이션)
const startTraining = () => {
  if (selectedDocIds.value.length === 0) return;

  isTraining.value = true;
  trainingProgress.value = 0;

  // 진행률 시뮬레이션 (실제로는 백엔드 API 호출)
  const interval = setInterval(() => {
    trainingProgress.value += Math.random() * 5;
    if (trainingProgress.value >= 100) {
      trainingProgress.value = 100;
      isTraining.value = false;
      clearInterval(interval);

      // 학습 완료 알림
      alert(
        `선택한 ${selectedDocIds.value.length}개 문서로 학습이 완료되었습니다!`
      );
    }
  }, 500);
};

// 초기 데이터 로드
fetchDocs();
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
