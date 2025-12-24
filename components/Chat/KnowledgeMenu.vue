<template>
  <!-- 확장 모드 (좌측 30% 영역을 꽉 채움) -->
  <Transition name="slide-fade">
    <div
      v-if="isExpanded"
      class="absolute top-0 left-0 right-0 bottom-0 z-40 bg-white flex flex-col"
    >
      <!-- 확장 모드 헤더 -->
      <div class="p-3 pr-1 border-b border-zinc-200">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center text-xs text-zinc-600">
            <span>선택된 문서</span>
            <span class="ml-1 font-semibold text-slate-800">{{
              selectedCount
            }}</span>
            <span>개</span>
          </div>

          <!-- 닫기 버튼 -->
          <button
            type="button"
            class="px-2 py-1 hover:bg-zinc-100 rounded transition-colors flex-shrink-0 ml-2"
            @click="isExpanded = false"
            title="축소"
          >
            <Icon name="lucide:minimize-2" class="w-4 h-4 text-zinc-500" />
          </button>
        </div>
        <div class="flex items-center justify-between">
          <!-- 전체 선택 버튼 -->
          <button
            type="button"
            class="w-full text-left text-xs py-1.5 px-2 pl-0 font-semibold text-zinc-600 border-none hover:bg-zinc-50 transition-colors flex items-center justify-between group"
            @click="selectAllKnowledge"
            title="지식저장소의 모든 문서를 선택합니다"
          >
            <span>지식저장소</span>
            <Icon
              name="bi:check2-all"
              class="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 ml-1 w-4 h-4"
            />
          </button>
        </div>
      </div>

      <!-- 확장 모드 콘텐츠 -->
      <div
        class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-zinc"
        style="scrollbar-gutter: stable"
      >
        <div class="p-3 pr-1">
          <CategoryTree
            :expanded-themes="expandedThemes"
            :expanded-sub-menus="expandedSubMenus"
            :sc-years="scYears"
            :selected-categories="selectedCategories"
            @toggle-theme="toggleTheme"
            @toggle-sub-menu="toggleSubMenu"
            @select-category="selectCategory"
            @select-all-knowledge="selectAllKnowledge"
          />
        </div>
      </div>
    </div>
  </Transition>

  <!-- 일반 모드 -->
  <div
    v-if="!isExpanded"
    class="flex-1 min-h-0 border-zinc-200 bg-white flex flex-col"
  >
    <!-- 고정 헤더 영역(확장하기)-->
    <div class="p-1 pb-0 bg-white sticky top-0 z-10">
      <!-- 상단: 확장 버튼 -->
      <div class="flex justify-end mb-0.5">
        <button
          type="button"
          class="px-2 py-1 text-[10px] rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
          @click="isExpanded = true"
          title="확장"
        >
          확장하기
        </button>
      </div>
    </div>
    <div
      class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-zinc"
      style="scrollbar-gutter: stable"
    >
      <button
        type="button"
        class="w-full text-left text-xs py-1.5 px-2 mb-1 ml-1 font-semibold text-zinc-600 border-none hover:bg-zinc-50 transition-colors flex items-center justify-between group"
        @click="selectAllKnowledge"
        title="지식저장소의 모든 문서를 선택합니다"
      >
        <span>지식저장소</span>
        <Icon
          name="bi:check2-all"
          class="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 ml-1 w-4 h-4"
        />
      </button>
      <div class="p-3 pr-1 py-0">
        <CategoryTree
          :expanded-themes="expandedThemes"
          :expanded-sub-menus="expandedSubMenus"
          :sc-years="scYears"
          :selected-categories="selectedCategories"
          @toggle-theme="toggleTheme"
          @toggle-sub-menu="toggleSubMenu"
          @select-category="selectCategory"
          @select-all-knowledge="selectAllKnowledge"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import CategoryTree from "./CategoryTree.vue";

defineProps<{
  selectedCount?: number;
  selectedCategories: Set<string>; // 추가: 선택된 카테고리 상태
}>();

const emit = defineEmits<{
  (
    e: "category-selected",
    filter: { code?: string; detail?: string; sub?: string }
  ): void;
  (e: "select-all-knowledge"): void;
}>();

const isExpanded = ref(false);

const expandedThemes = reactive<Record<string, boolean>>({
  theme1: false,
  theme2: false,
  theme3: false,
  theme4: false,
  theme6: false,
  theme7: false,
  theme8: false,
  theme9: false,
});

const expandedSubMenus = reactive<Record<string, boolean>>({});

const scYears = [
  "2005",
  "2006",
  "2007",
  "2008",
  "2009",
  "2010",
  "2011",
  "2012",
  "2013",
  "2014",
  "2015",
  "2016",
  "2017",
  "2018",
  "2019",
  "2020",
  "2021",
  "2022",
  "2023",
  "2024",
];

const toggleTheme = (themeKey: string) => {
  expandedThemes[themeKey] = !expandedThemes[themeKey];
};

const toggleSubMenu = (menuKey: string) => {
  expandedSubMenus[menuKey] = !expandedSubMenus[menuKey];
};

const selectCategory = (code: string, detail?: string, sub?: string) => {
  console.log(
    `[KnowledgeMenu] Category selected: code=${code}, detail=${
      detail || "N/A"
    }, sub=${sub || "N/A"}`
  );
  emit("category-selected", { code, detail, sub });
};

const selectAllKnowledge = () => {
  emit("select-all-knowledge");
};
</script>
<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: transform 180ms ease, opacity 180ms ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-12px);
  opacity: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>
