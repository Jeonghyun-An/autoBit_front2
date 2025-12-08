<template>
  <div
    class="flex-1 border-t border-zinc-200 bg-white overflow-y-auto scrollbar-zinc"
    style="scrollbar-gutter: stable"
  >
    <div class="p-3 pr-1">
      <div class="text-xs font-semibold text-zinc-600 mb-2">지식저장소</div>

      <!-- Theme 1: 협정 및 법령 -->
      <div class="border-b border-zinc-200">
        <button
          type="button"
          class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
          @click="toggleTheme('theme1')"
        >
          <span>협정 및 법령</span>
          <Icon
            :name="
              expandedThemes.theme1
                ? 'lucide:chevron-down'
                : 'lucide:chevron-right'
            "
            class="w-3 h-3"
          />
        </button>
        <div v-if="expandedThemes.theme1" class="pl-4 pb-2 space-y-1">
          <!-- 1-1 양자협정 -->
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('1', '1')"
          >
            양자협정
          </div>

          <!-- IAEA협정 (중첩) -->
          <div>
            <button
              type="button"
              class="w-full text-left text-xs py-1 px-2 hover:bg-zinc-50 rounded flex items-center justify-between"
              @click="toggleSubMenu('theme1-iaea')"
            >
              <span>IAEA협정</span>
              <Icon
                :name="
                  expandedSubMenus['theme1-iaea']
                    ? 'lucide:chevron-down'
                    : 'lucide:chevron-right'
                "
                class="w-3 h-3"
              />
            </button>
            <div v-if="expandedSubMenus['theme1-iaea']" class="pl-4 space-y-1">
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('1', '2', '1')"
              >
                CSA
              </div>
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('1', '2', '2')"
              >
                CSA 보조약정
              </div>
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('1', '2', '3')"
              >
                AP
              </div>
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('1', '2', '4')"
              >
                AP 보조약정
              </div>
            </div>
          </div>

          <!-- 1-3 법령 -->
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('1', '3')"
          >
            법령
          </div>

          <!-- 1-4 고시 -->
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('1', '4')"
          >
            고시
          </div>
        </div>
      </div>

      <!-- Theme 2: 시설정보 -->
      <div class="border-b border-zinc-200">
        <button
          type="button"
          class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
          @click="toggleTheme('theme2')"
        >
          <span>시설정보</span>
          <Icon
            :name="
              expandedThemes.theme2
                ? 'lucide:chevron-down'
                : 'lucide:chevron-right'
            "
            class="w-3 h-3"
          />
        </button>
        <div v-if="expandedThemes.theme2" class="pl-4 pb-2 space-y-1">
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('2', '1')"
          >
            시설부록(FA)
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('2', '2')"
          >
            설계정보서(DIQ)
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('2', '3')"
          >
            시설 프로파일
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('2', '4')"
          >
            계량관리규정
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('2', '5')"
          >
            시설 계량관리 담당자 연락처
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('2', '6')"
          >
            기타 시설정보
          </div>
        </div>
      </div>

      <!-- Theme 3: IAEA 자료 -->
      <div class="border-b border-zinc-200">
        <button
          type="button"
          class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
          @click="toggleTheme('theme3')"
        >
          <span>IAEA 자료</span>
          <Icon
            :name="
              expandedThemes.theme3
                ? 'lucide:chevron-down'
                : 'lucide:chevron-right'
            "
            class="w-3 h-3"
          />
        </button>
        <div v-if="expandedThemes.theme3" class="pl-4 pb-2 space-y-1">
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('3', '1')"
          >
            사찰매뉴얼
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('3', '2')"
          >
            장비매뉴얼
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('3', '3')"
          >
            IAEA 안전조치 절차서
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('3', '4')"
          >
            사찰관정보/UNLP
          </div>

          <!-- IAEA 발간문서 (중첩) -->
          <div>
            <button
              type="button"
              class="w-full text-left text-xs py-1 px-2 hover:bg-zinc-50 rounded flex items-center justify-between"
              @click="toggleSubMenu('theme3-pub')"
            >
              <span>IAEA 발간문서</span>
              <Icon
                :name="
                  expandedSubMenus['theme3-pub']
                    ? 'lucide:chevron-down'
                    : 'lucide:chevron-right'
                "
                class="w-3 h-3"
              />
            </button>
            <div v-if="expandedSubMenus['theme3-pub']" class="pl-4 space-y-1">
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('3', '5', '1')"
              >
                IAEA TECDOC
              </div>
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('3', '5', '2')"
              >
                IAEA Service Series
              </div>
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('3', '5', '3')"
              >
                IAEA STR
              </div>
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('3', '5', '4')"
              >
                기타 IAEA 문서
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Theme 6: 번역자료 (뎁스 없음 - 화살표 제거) -->
      <div class="border-b border-zinc-200">
        <div
          class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 cursor-pointer"
          @click="selectCategory('6')"
        >
          <span>번역자료</span>
        </div>
      </div>

      <!-- Theme 9: SC -->
      <div class="border-b border-zinc-200">
        <button
          type="button"
          class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
          @click="toggleTheme('theme9')"
        >
          <span>SC</span>
          <Icon
            :name="
              expandedThemes.theme9
                ? 'lucide:chevron-down'
                : 'lucide:chevron-right'
            "
            class="w-3 h-3"
          />
        </button>
        <div v-if="expandedThemes.theme9" class="pl-4 pb-2 space-y-1">
          <!-- Incoming (중첩) -->
          <div>
            <button
              type="button"
              class="w-full text-left text-xs py-1 px-2 hover:bg-zinc-50 rounded flex items-center justify-between"
              @click="toggleSubMenu('theme9-in')"
            >
              <span>Incoming</span>
              <Icon
                :name="
                  expandedSubMenus['theme9-in']
                    ? 'lucide:chevron-down'
                    : 'lucide:chevron-right'
                "
                class="w-3 h-3"
              />
            </button>
            <div
              v-if="expandedSubMenus['theme9-in']"
              class="pl-4 space-y-1 max-h-48 overflow-y-auto scrollbar-zinc"
            >
              <div
                v-for="(year, idx) in scYears"
                :key="`incoming-${year}`"
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('9', '1', String(idx + 1))"
              >
                {{ year }}
              </div>
            </div>
          </div>

          <!-- Outgoing (중첩) -->
          <div>
            <button
              type="button"
              class="w-full text-left text-xs py-1 px-2 hover:bg-zinc-50 rounded flex items-center justify-between"
              @click="toggleSubMenu('theme9-out')"
            >
              <span>Outgoing</span>
              <Icon
                :name="
                  expandedSubMenus['theme9-out']
                    ? 'lucide:chevron-down'
                    : 'lucide:chevron-right'
                "
                class="w-3 h-3"
              />
            </button>
            <div
              v-if="expandedSubMenus['theme9-out']"
              class="pl-4 space-y-1 max-h-48 overflow-y-auto scrollbar-zinc"
            >
              <div
                v-for="(year, idx) in scYears"
                :key="`outgoing-${year}`"
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('9', '2', String(idx + 1))"
              >
                {{ year }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Theme 4: KINAC 자료 -->
      <div class="border-b border-zinc-200">
        <button
          type="button"
          class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
          @click="toggleTheme('theme4')"
        >
          <span>KINAC 자료</span>
          <Icon
            :name="
              expandedThemes.theme4
                ? 'lucide:chevron-down'
                : 'lucide:chevron-right'
            "
            class="w-3 h-3"
          />
        </button>
        <div v-if="expandedThemes.theme4" class="pl-4 pb-2 space-y-1">
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('4', '1')"
          >
            심검사기준
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('4', '2')"
          >
            심검사지침
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('4', '3')"
          >
            절차서
          </div>

          <!-- 보고서 (중첩) -->
          <div>
            <button
              type="button"
              class="w-full text-left text-xs py-1 px-2 hover:bg-zinc-50 rounded flex items-center justify-between"
              @click="toggleSubMenu('theme4-report')"
            >
              <span>보고서</span>
              <Icon
                :name="
                  expandedSubMenus['theme4-report']
                    ? 'lucide:chevron-down'
                    : 'lucide:chevron-right'
                "
                class="w-3 h-3"
              />
            </button>
            <div
              v-if="expandedSubMenus['theme4-report']"
              class="pl-4 space-y-1"
            >
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('4', '4', '1')"
              >
                기술보고서
              </div>
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('4', '4', '2')"
              >
                연구보고서
              </div>
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('4', '4', '3')"
              >
                귀국보고서
              </div>
              <div
                class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
                @click="selectCategory('4', '4', '4')"
              >
                용역/위탁보고서
              </div>
            </div>
          </div>

          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('4', '5')"
          >
            논문
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('4', '6')"
          >
            검사원정보
          </div>
        </div>
      </div>

      <!-- Theme 8: 회의 자료 -->
      <div class="border-b border-zinc-200">
        <button
          type="button"
          class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
          @click="toggleTheme('theme8')"
        >
          <span>회의 자료</span>
          <Icon
            :name="
              expandedThemes.theme8
                ? 'lucide:chevron-down'
                : 'lucide:chevron-right'
            "
            class="w-3 h-3"
          />
        </button>
        <div v-if="expandedThemes.theme8" class="pl-4 pb-2 space-y-1">
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('8', '1')"
          >
            CGEC
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('8', '2')"
          >
            JRM
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('8', '3')"
          >
            IMWG
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('8', '4')"
          >
            IAEA 이사회
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('8', '5')"
          >
            양자협력회의
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('8', '6')"
          >
            SAGSI
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('8', '7')"
          >
            연례안전조치평가회의
          </div>
          <div
            class="text-xs py-1 px-2 hover:bg-zinc-50 rounded cursor-pointer"
            @click="selectCategory('8', '8')"
          >
            세미나 및 워크샵
          </div>
        </div>
      </div>

      <!-- Theme 7: 교육자료 (뎁스 없음 - 화살표 제거) -->
      <div class="border-b border-zinc-200">
        <div
          class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 cursor-pointer"
          @click="selectCategory('7')"
        >
          <span>교육자료</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";

const emit = defineEmits<{
  (
    e: "category-selected",
    filter: { code?: string; detail?: string; sub?: string }
  ): void;
}>();

// 아코디언 상태 관리
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

// SC 연도 목록
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

// 테마 토글 함수
const toggleTheme = (themeKey: string) => {
  expandedThemes[themeKey] = !expandedThemes[themeKey];
};

// 서브메뉴 토글 함수
const toggleSubMenu = (menuKey: string) => {
  expandedSubMenus[menuKey] = !expandedSubMenus[menuKey];
};

/**
 * 카테고리 선택 시 필터 조건 emit
 * 부모 컴포넌트에서 useDocsList의 docs를 필터링해서
 * 선택된 카테고리 기준으로 문서 목록/선택 → doc_ids → /ask 로 연결
 */
const selectCategory = (code: string, detail?: string, sub?: string) => {
  console.log(
    `[KnowledgeMenu] Category selected: code=${code}, detail=${
      detail || "N/A"
    }, sub=${sub || "N/A"}`
  );
  emit("category-selected", { code, detail, sub });
};
</script>
