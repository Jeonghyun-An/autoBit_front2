<template>
  <div>
    <!-- Theme 1: 협정 및 법령 (data_code = theme1) -->
    <div class="border-b border-zinc-200">
      <button
        type="button"
        class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
        @click="$emit('toggle-theme', 'theme1')"
      >
        <span class="flex items-center gap-1.5">
          협정 및 법령
          <span
            v-if="hasSelectedChild('theme1')"
            class="w-1.5 h-1.5 rounded-full bg-slate-900"
          ></span>
        </span>
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
        <!-- Theme1 전체 -->
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer font-semibold transition-colors"
          :class="
            isSelected('theme1')
              ? 'bg-slate-900 text-white'
              : 'text-zinc-700 hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme1')"
        >
          전체 (협정 및 법령)
        </div>

        <!-- 1-1 양자협정: theme1 / theme1-1 / (-) -->
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme1', 'theme1-1')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme1', 'theme1-1')"
        >
          양자협정
        </div>

        <!-- IAEA협정 (중첩) -->
        <div>
          <button
            type="button"
            class="w-full text-left text-xs py-1 px-2 hover:bg-zinc-50 rounded flex items-center justify-between"
            @click="$emit('toggle-sub-menu', 'theme1-iaea')"
          >
            <span class="flex items-center gap-1.5">
              IAEA협정
              <span
                v-if="hasSelectedChild('theme1', 'theme1-2')"
                class="w-1.5 h-1.5 rounded-full bg-slate-900"
              ></span>
            </span>
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
            <!--  IAEA협정 전체: theme1 / theme1-2 / (all sub) -->
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer font-semibold transition-colors"
              :class="
                isSelected('theme1', 'theme1-2')
                  ? 'bg-slate-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-50'
              "
              @click="$emit('select-category', 'theme1', 'theme1-2')"
            >
              전체 (IAEA협정)
            </div>

            <!-- theme1 / theme1-2 / theme1-2-1 -->
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme1', 'theme1-2', 'theme1-2-1')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme1', 'theme1-2', 'theme1-2-1')
              "
            >
              CSA
            </div>
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme1', 'theme1-2', 'theme1-2-2')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme1', 'theme1-2', 'theme1-2-2')
              "
            >
              CSA 보조약정
            </div>
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme1', 'theme1-2', 'theme1-2-3')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme1', 'theme1-2', 'theme1-2-3')
              "
            >
              AP
            </div>
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme1', 'theme1-2', 'theme1-2-4')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme1', 'theme1-2', 'theme1-2-4')
              "
            >
              AP 보조약정
            </div>
          </div>
        </div>

        <!-- 1-3 법령: theme1 / theme1-3 -->
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme1', 'theme1-3')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme1', 'theme1-3')"
        >
          법령
        </div>

        <!-- 1-4 고시: theme1 / theme1-4 -->
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme1', 'theme1-4')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme1', 'theme1-4')"
        >
          고시
        </div>
      </div>
    </div>

    <!-- Theme 2: 시설정보 (data_code = theme2) -->
    <div class="border-b border-zinc-200">
      <button
        type="button"
        class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
        @click="$emit('toggle-theme', 'theme2')"
      >
        <span class="flex items-center gap-1.5">
          시설정보
          <span
            v-if="hasSelectedChild('theme2')"
            class="w-1.5 h-1.5 rounded-full bg-slate-900"
          ></span>
        </span>
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
          class="text-xs py-1 px-2 rounded cursor-pointer font-semibold transition-colors"
          :class="
            isSelected('theme2')
              ? 'bg-slate-900 text-white'
              : 'text-zinc-700 hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme2')"
        >
          전체 (시설정보)
        </div>

        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme2', 'theme2-1')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme2', 'theme2-1')"
        >
          시설부록(FA)
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme2', 'theme2-2')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme2', 'theme2-2')"
        >
          설계정보서(DIQ)
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme2', 'theme2-3')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme2', 'theme2-3')"
        >
          시설 프로파일
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme2', 'theme2-4')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme2', 'theme2-4')"
        >
          계량관리규정
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme2', 'theme2-5')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme2', 'theme2-5')"
        >
          시설 계량관리 담당자 연락처
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme2', 'theme2-6')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme2', 'theme2-6')"
        >
          기타 시설정보
        </div>
      </div>
    </div>

    <!-- Theme 3: IAEA 자료 (data_code = theme3) -->
    <div class="border-b border-zinc-200">
      <button
        type="button"
        class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
        @click="$emit('toggle-theme', 'theme3')"
      >
        <span class="flex items-center gap-1.5">
          IAEA 자료
          <span
            v-if="hasSelectedChild('theme3')"
            class="w-1.5 h-1.5 rounded-full bg-slate-900"
          ></span>
        </span>
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
          class="text-xs py-1 px-2 rounded cursor-pointer font-semibold transition-colors"
          :class="
            isSelected('theme3')
              ? 'bg-slate-900 text-white'
              : 'text-zinc-700 hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme3')"
        >
          전체 (IAEA 자료)
        </div>

        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme3', 'theme3-1')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme3', 'theme3-1')"
        >
          사찰매뉴얼
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme3', 'theme3-2')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme3', 'theme3-2')"
        >
          장비매뉴얼
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme3', 'theme3-3')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme3', 'theme3-3')"
        >
          IAEA 안전조치 절차서
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme3', 'theme3-4')
              ? `bg-slate-900 text-white`
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme3', 'theme3-4')"
        >
          사찰관정보/UNLP
        </div>

        <!-- IAEA 발간문서 (중첩) theme3-5 / theme3-5-x -->
        <div>
          <button
            type="button"
            class="w-full text-left text-xs py-1 px-2 hover:bg-zinc-50 rounded flex items-center justify-between"
            @click="$emit('toggle-sub-menu', 'theme3-pub')"
          >
            <span class="flex items-center gap-1.5">
              IAEA 발간문서
              <span
                v-if="hasSelectedChild('theme3', 'theme3-5')"
                class="w-1.5 h-1.5 rounded-full bg-slate-900"
              ></span>
            </span>
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
              class="text-xs py-1 px-2 rounded cursor-pointer font-semibold transition-colors"
              :class="
                isSelected('theme3', 'theme3-5')
                  ? 'bg-slate-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-50'
              "
              @click="$emit('select-category', 'theme3', 'theme3-5')"
            >
              전체 (IAEA 발간문서)
            </div>

            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme3', 'theme3-5', 'theme3-5-1')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme3', 'theme3-5', 'theme3-5-1')
              "
            >
              IAEA TECDOC
            </div>
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme3', 'theme3-5', 'theme3-5-2')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme3', 'theme3-5', 'theme3-5-2')
              "
            >
              IAEA Service Series
            </div>
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme3', 'theme3-5', 'theme3-5-3')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme3', 'theme3-5', 'theme3-5-3')
              "
            >
              IAEA STR
            </div>
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme3', 'theme3-5', 'theme3-5-4')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme3', 'theme3-5', 'theme3-5-4')
              "
            >
              기타 IAEA 문서
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Theme 6: 번역자료 (data_code = theme6, depth 없음) -->
    <div class="border-b border-zinc-200">
      <div
        class="w-full text-left px-2 py-2 text-xs font-medium cursor-pointer transition-colors"
        :class="
          isSelected('theme6') ? 'bg-slate-900 text-white' : 'hover:bg-zinc-50'
        "
        @click="$emit('select-category', 'theme6')"
      >
        <span>번역자료</span>
      </div>
    </div>

    <!-- Theme 9: SC (data_code = theme9) -->
    <div class="border-b border-zinc-200">
      <button
        type="button"
        class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
        @click="$emit('toggle-theme', 'theme9')"
      >
        <span class="flex items-center gap-1.5">
          SC
          <span
            v-if="hasSelectedChild('theme9')"
            class="w-1.5 h-1.5 rounded-full bg-slate-900"
          ></span>
        </span>
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
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer font-semibold transition-colors"
          :class="
            isSelected('theme9')
              ? 'bg-slate-900 text-white'
              : 'text-zinc-700 hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme9')"
        >
          전체 (SC 전체)
        </div>

        <!-- Incoming (중첩) : theme9-1 -->
        <div>
          <button
            type="button"
            class="w-full text-left text-xs py-1 px-2 hover:bg-zinc-50 rounded flex items-center justify-between"
            @click="$emit('toggle-sub-menu', 'theme9-in')"
          >
            <span class="flex items-center gap-1.5">
              Incoming
              <span
                v-if="hasSelectedChild('theme9', 'theme9-1')"
                class="w-1.5 h-1.5 rounded-full bg-slate-900"
              ></span>
            </span>
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
            class="pl-4 space-y-1 overflow-y-auto scrollbar-zinc"
          >
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer font-semibold transition-colors"
              :class="
                isSelected('theme9', 'theme9-1')
                  ? 'bg-slate-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-50'
              "
              @click="$emit('select-category', 'theme9', 'theme9-1')"
            >
              전체 (Incoming)
            </div>

            <div
              v-for="year in scYears"
              :key="`incoming-${year}`"
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected(
                  'theme9',
                  'theme9-1',
                  yearToSubCode(year, 'theme9-1')
                )
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit(
                  'select-category',
                  'theme9',
                  'theme9-1',
                  yearToSubCode(year, 'theme9-1')
                )
              "
            >
              {{ year }}
            </div>
          </div>
        </div>

        <!-- Outgoing (중첩) : theme9-2 -->
        <div>
          <button
            type="button"
            class="w-full text-left text-xs py-1 px-2 hover:bg-zinc-50 rounded flex items-center justify-between"
            @click="$emit('toggle-sub-menu', 'theme9-out')"
          >
            <span class="flex items-center gap-1.5">
              Outgoing
              <span
                v-if="hasSelectedChild('theme9', 'theme9-2')"
                class="w-1.5 h-1.5 rounded-full bg-slate-900"
              ></span>
            </span>
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
            class="pl-4 space-y-1 overflow-y-auto scrollbar-zinc"
          >
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer font-semibold transition-colors"
              :class="
                isSelected('theme9', 'theme9-2')
                  ? 'bg-slate-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-50'
              "
              @click="$emit('select-category', 'theme9', 'theme9-2')"
            >
              전체 (Outgoing)
            </div>

            <div
              v-for="year in scYears"
              :key="`outgoing-${year}`"
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected(
                  'theme9',
                  'theme9-2',
                  yearToSubCode(year, 'theme9-2')
                )
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit(
                  'select-category',
                  'theme9',
                  'theme9-2',
                  yearToSubCode(year, 'theme9-2')
                )
              "
            >
              {{ year }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Theme 4: KINAC 자료 (data_code = theme4) -->
    <div class="border-b border-zinc-200">
      <button
        type="button"
        class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
        @click="$emit('toggle-theme', 'theme4')"
      >
        <span class="flex items-center gap-1.5">
          KINAC 자료
          <span
            v-if="hasSelectedChild('theme4')"
            class="w-1.5 h-1.5 rounded-full bg-slate-900"
          ></span>
        </span>
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
          class="text-xs py-1 px-2 rounded cursor-pointer font-semibold transition-colors"
          :class="
            isSelected('theme4')
              ? 'bg-slate-900 text-white'
              : 'text-zinc-700 hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme4')"
        >
          전체 (KINAC 자료)
        </div>

        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme4', 'theme4-1')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme4', 'theme4-1')"
        >
          심검사기준
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme4', 'theme4-2')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme4', 'theme4-2')"
        >
          심검사지침
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme4', 'theme4-3')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme4', 'theme4-3')"
        >
          절차서
        </div>

        <!-- 보고서 (중첩) theme4-4 / theme4-4-x -->
        <div>
          <button
            type="button"
            class="w-full text-left text-xs py-1 px-2 hover:bg-zinc-50 rounded flex items-center justify-between"
            @click="$emit('toggle-sub-menu', 'theme4-report')"
          >
            <span class="flex items-center gap-1.5">
              보고서
              <span
                v-if="hasSelectedChild('theme4', 'theme4-4')"
                class="w-1.5 h-1.5 rounded-full bg-slate-900"
              ></span>
            </span>
            <Icon
              :name="
                expandedSubMenus['theme4-report']
                  ? 'lucide:chevron-down'
                  : 'lucide:chevron-right'
              "
              class="w-3 h-3"
            />
          </button>
          <div v-if="expandedSubMenus['theme4-report']" class="pl-4 space-y-1">
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer font-semibold transition-colors"
              :class="
                isSelected('theme4', 'theme4-4')
                  ? 'bg-slate-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-50'
              "
              @click="$emit('select-category', 'theme4', 'theme4-4')"
            >
              전체 (보고서)
            </div>

            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme4', 'theme4-4', 'theme4-4-1')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme4', 'theme4-4', 'theme4-4-1')
              "
            >
              기술보고서
            </div>
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme4', 'theme4-4', 'theme4-4-2')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme4', 'theme4-4', 'theme4-4-2')
              "
            >
              연구보고서
            </div>
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme4', 'theme4-4', 'theme4-4-3')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme4', 'theme4-4', 'theme4-4-3')
              "
            >
              귀국보고서
            </div>
            <div
              class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
              :class="
                isSelected('theme4', 'theme4-4', 'theme4-4-4')
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-zinc-50'
              "
              @click="
                $emit('select-category', 'theme4', 'theme4-4', 'theme4-4-4')
              "
            >
              용역/위탁보고서
            </div>
          </div>
        </div>

        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme4', 'theme4-5')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme4', 'theme4-5')"
        >
          논문
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme4', 'theme4-6')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme4', 'theme4-6')"
        >
          검사원정보
        </div>
      </div>
    </div>

    <!-- Theme 8: 회의 자료 (data_code = theme8) -->
    <div class="border-b border-zinc-200">
      <button
        type="button"
        class="w-full text-left px-2 py-2 text-xs font-medium hover:bg-zinc-50 flex items-center justify-between"
        @click="$emit('toggle-theme', 'theme8')"
      >
        <span class="flex items-center gap-1.5">
          회의 자료
          <span
            v-if="hasSelectedChild('theme8')"
            class="w-1.5 h-1.5 rounded-full bg-slate-900"
          ></span>
        </span>
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
          class="text-xs py-1 px-2 rounded cursor-pointer font-semibold transition-colors"
          :class="
            isSelected('theme8')
              ? 'bg-slate-900 text-white'
              : 'text-zinc-700 hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme8')"
        >
          전체 (회의 자료)
        </div>

        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme8', 'theme8-1')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme8', 'theme8-1')"
        >
          CGEC
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme8', 'theme8-2')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme8', 'theme8-2')"
        >
          JRM
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme8', 'theme8-3')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme8', 'theme8-3')"
        >
          IMWG
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme8', 'theme8-4')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme8', 'theme8-4')"
        >
          IAEA 이사회
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme8', 'theme8-5')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme8', 'theme8-5')"
        >
          양자협력회의
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme8', 'theme8-6')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme8', 'theme8-6')"
        >
          SAGSI
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme8', 'theme8-7')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme8', 'theme8-7')"
        >
          연례안전조치평가회의
        </div>
        <div
          class="text-xs py-1 px-2 rounded cursor-pointer transition-colors"
          :class="
            isSelected('theme8', 'theme8-8')
              ? 'bg-slate-900 text-white'
              : 'hover:bg-zinc-50'
          "
          @click="$emit('select-category', 'theme8', 'theme8-8')"
        >
          세미나 및 워크샵
        </div>
      </div>
    </div>

    <!-- Theme 7: 교육자료 (data_code = theme7, depth 없음) -->
    <div class="border-b border-zinc-200">
      <div
        class="w-full text-left px-2 py-2 text-xs font-medium cursor-pointer transition-colors"
        :class="
          isSelected('theme7') ? 'bg-slate-900 text-white' : 'hover:bg-zinc-50'
        "
        @click="$emit('select-category', 'theme7')"
      >
        <span>교육자료</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  expandedThemes: Record<string, boolean>;
  expandedSubMenus: Record<string, boolean>;
  scYears: string[];
  selectedCategories: Set<string>;
  categoryDocCounts?: Map<string, number>;
}>();

defineEmits<{
  (e: "toggle-theme", key: string): void;
  (e: "toggle-sub-menu", key: string): void;
  (e: "select-category", code: string, detail?: string, sub?: string): void;
  (e: "select-all-knowledge"): void;
}>();

function yearToSubCode(year: string, detailCode: string): string {
  const index = props.scYears.indexOf(year);
  if (index === -1) return "";

  const sequenceNum = index + 1;
  const detailNum = detailCode.split("-")[1];

  return `theme9-${detailNum}-${sequenceNum}`;
}

// 카테고리 선택 상태 확인 함수
function isSelected(code: string, detail?: string, sub?: string): boolean {
  let key = code;
  if (detail) key += `::${detail}`;
  if (sub) key += `::${sub}`;
  return props.selectedCategories.has(key);
}
// 하위 카테고리 선택 여부 확인 함수
function hasSelectedChild(code: string, detail?: string): boolean {
  const prefix = detail ? `${code}::${detail}::` : `${code}::`;

  for (const key of props.selectedCategories) {
    if (key.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

function getDocCount(code: string, detail?: string, sub?: string): number {
  if (!props.categoryDocCounts) return 0;
  let key = code;
  if (detail) key += `::${detail}`;
  if (sub) key += `::${sub}`;
  return props.categoryDocCounts.get(key) || 0;
}

function formatDocCount(count: number): string {
  if (count === 0) return "";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}
</script>
