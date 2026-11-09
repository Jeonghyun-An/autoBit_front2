<template>
  <div class="border-b border-zinc-200 bg-white">
    <!-- 토글 헤더 -->
    <button
      type="button"
      class="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-zinc-50 transition-colors"
      @click="togglePanel"
    >
      <Icon
        name="lucide:settings-2"
        class="w-4 h-4 text-zinc-500 flex-shrink-0"
      />
      <span class="text-xs font-semibold text-zinc-600">응답 설정</span>
      <span class="ml-auto text-[10px] text-zinc-400 mr-1">파일럿 전용</span>
      <Icon
        name="lucide:chevron-down"
        :class="[
          'w-4 h-4 text-zinc-400 transition-transform duration-200',
          isOpen && 'rotate-180',
        ]"
      />
    </button>

    <!-- 패널 본체 -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="isOpen" class="px-4 pb-4 space-y-4">
        <!-- 상태 배너 -->
        <div
          v-if="statusMsg"
          :class="[
            'px-3 py-2 rounded-lg text-xs font-medium',
            statusType === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200',
          ]"
        >
          {{ statusMsg }}
        </div>

        <!-- 시험 모드: 슬라이더 값을 이 대화의 질문에만 적용 (서버 전체 설정은 그대로) -->
        <label
          class="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 cursor-pointer"
        >
          <input
            v-model="testMode"
            type="checkbox"
            class="mt-0.5 accent-emerald-600"
          />
          <span class="text-[11px] leading-relaxed text-emerald-800">
            <b>시험 모드</b> — 아래 값으로 이 대화의 질문에만 적용합니다. 서버
            설정과 다른 사용자에게는 영향이 없습니다. 마음에 들면 “전체에
            적용”을 누르세요.
          </span>
        </label>
        <button
          type="button"
          class="text-[11px] text-zinc-500 underline hover:text-zinc-700 disabled:opacity-50"
          :disabled="isLoading"
          @click="loadConfig(true)"
        >
          서버에 적용된 값으로 되돌리기
        </button>

        <!-- 모드 탭 -->
        <div class="flex gap-1 bg-zinc-100 rounded-lg p-1">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            :class="[
              'flex-1 py-1.5 text-xs font-medium rounded-md transition-colors',
              selectedTab === tab.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700',
            ]"
            @click="selectedTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 단문형 설정 -->
        <div v-if="selectedTab === 'short'" class="space-y-3">
          <ParamSlider
            label="참고 문서 수"
            hint="많을수록 참고 범위가 넓어짐"
            v-model="short.top_k"
            :min="1"
            :max="20"
            :step="1"
          />
          <ParamSlider
            label="답변 최대 길이"
            hint="길수록 더 자세한 답변. 단문형은 짧게 유지 권장"
            v-model="short.max_tokens"
            :min="100"
            :max="1000"
            :step="50"
          />
          <ParamSlider
            label="참고 내용 분량"
            hint="많을수록 풍부하지만 느려짐"
            v-model="short.context_budget"
            :min="256"
            :max="4096"
            :step="256"
          />
          <ParamSlider
            label="답변 일관성"
            hint="0 = 문서에 충실한 답변 / 1 = 다양한 표현의 답변"
            v-model="short.temperature"
            :min="0"
            :max="1"
            :step="0.1"
            :decimals="1"
          />
        </div>

        <!-- 장문형 설정 -->
        <div v-if="selectedTab === 'long'" class="space-y-3">
          <ParamSlider
            label="참고 문서 수"
            hint="많을수록 참고 범위가 넓어짐"
            v-model="long.top_k"
            :min="1"
            :max="30"
            :step="1"
          />
          <ParamSlider
            label="답변 최대 길이"
            hint="길수록 더 자세한 답변"
            v-model="long.max_tokens"
            :min="500"
            :max="7000"
            :step="100"
          />
          <ParamSlider
            label="참고 내용 분량"
            hint="많을수록 풍부하지만 느려짐"
            v-model="long.context_budget"
            :min="512"
            :max="8192"
            :step="512"
          />
          <ParamSlider
            label="답변 일관성"
            hint="0 = 문서에 충실한 답변 / 1 = 다양한 표현의 답변"
            v-model="long.temperature"
            :min="0"
            :max="1"
            :step="0.1"
            :decimals="1"
          />
        </div>

        <!-- 초장문형 설정 -->
        <div v-if="selectedTab === 'ultra'" class="space-y-3">
          <ParamSlider
            label="참고 문서 단락 수"
            hint="많을 수록 응답이 느려짐"
            v-model="ultra.top_k"
            :min="50"
            :max="150"
            :step="10"
          />
          <ParamSlider
            label="답변 최대 길이"
            hint="초장문형 답변의 최대 길이"
            v-model="ultra.max_tokens"
            :min="1000"
            :max="5000"
            :step="500"
          />
          <ParamSlider
            label="답변 일관성"
            hint="0 = 문서에 충실한 답변 / 1 = 다양한 표현의 답변"
            v-model="ultra.temperature"
            :min="0"
            :max="1"
            :step="0.1"
            :decimals="1"
          />
        </div>

        <!-- 검색 설정 -->
        <div v-if="selectedTab === 'search'" class="space-y-3">
          <p class="text-[11px] text-zinc-400 leading-relaxed">
            검색된 문서 내용 중 얼마나 관련성 높은 것만 답변에 포함할지
            조정합니다.
            <br />
            낮출수록 더 많은 문서가 포함되어 풍부하지만, 너무 낮으면 관련성 낮은
            정보가 섞일 수 있습니다.
          </p>
          <ParamSlider
            label="답변 포함 기준 (단문/장문)"
            hint="모든 검색 결과 포함 / 가장 관련성 높은 결과만 포함"
            v-model="search.base_score_threshold"
            :min="0"
            :max="1"
            :step="0.05"
            :decimals="2"
          />
          <ParamSlider
            label="답변 포함 기준 (초장문)"
            hint="모든 검색 결과 포함 / 가장 관련성 높은 결과만 포함"
            v-model="search.ultra_score_threshold"
            :min="0"
            :max="1"
            :step="0.05"
            :decimals="2"
          />
        </div>

        <!-- 버튼 영역 -->
        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="px-3 py-1.5 text-xs text-zinc-500 border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            :disabled="isLoading"
            @click="resetConfig"
          >
            서버 기본값 복원
          </button>
          <button
            type="button"
            class="flex-1 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            :disabled="isLoading"
            @click="applyConfig"
          >
            <span v-if="isLoading">적용 중...</span>
            <span v-else>전체에 적용</span>
          </button>
        </div>

        <!-- 서버 현재값 -->
        <details v-if="serverConfig">
          <summary
            class="text-[10px] text-zinc-400 cursor-pointer hover:text-zinc-600 select-none list-none flex items-center gap-1"
          >
            <Icon name="lucide:info" class="w-3 h-3" />
            현재 적용값 확인
          </summary>
          <div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <template v-if="serverConfig.short">
              <span class="text-zinc-400">단문 · 참고 문서 수</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.short.top_k
              }}</span>
              <span class="text-zinc-400">단문 · 답변 최대 길이</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.short.max_tokens
              }}</span>
              <span class="text-zinc-400">단문 · 참고 내용 분량</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.short.context_budget
              }}</span>
              <span class="text-zinc-400">단문 · 답변 일관성</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.short.temperature
              }}</span>
            </template>
            <template v-if="serverConfig.long">
              <span class="text-zinc-400">장문 · 참고 문서 수</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.long.top_k
              }}</span>
              <span class="text-zinc-400">장문 · 답변 최대 길이</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.long.max_tokens
              }}</span>
              <span class="text-zinc-400">장문 · 참고 내용 분량</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.long.context_budget
              }}</span>
              <span class="text-zinc-400">장문 · 답변 일관성</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.long.temperature
              }}</span>
            </template>
            <template v-if="serverConfig.ultra_long">
              <span class="text-zinc-400">초장문 · 참고 문서 수</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.ultra_long.top_k
              }}</span>
              <span class="text-zinc-400">초장문 · 답변 최대 길이</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.ultra_long.max_tokens
              }}</span>
              <span class="text-zinc-400">초장문 · 답변 일관성</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.ultra_long.temperature
              }}</span>
            </template>
            <template v-if="serverConfig.search">
              <span class="text-zinc-400">단/장문 · 포함 기준</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.search.base_score_threshold
              }}</span>
              <span class="text-zinc-400">초장문 · 포함 기준</span>
              <span class="text-zinc-700 font-medium">{{
                serverConfig.search.ultra_score_threshold
              }}</span>
            </template>
          </div>
        </details>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, toRef } from "vue";
import ParamSlider from "@/components/Chat/ParamSlider.vue";
import { useRagDraft } from "@/composables/useRagDraft";

const props = defineProps<{ defaultOpen?: boolean }>();

// ==================== API Base ====================
const config = useRuntimeConfig();
const API = ((config.public.apiBase as string) || "/rag/llama").replace(
  /\/+$/,
  "",
);

// ==================== 타입 ====================
type RagConfig = {
  short: {
    top_k: number;
    max_tokens: number;
    temperature: number;
    context_budget: number;
  };
  long: {
    top_k: number;
    max_tokens: number;
    temperature: number;
    context_budget: number;
  };
  ultra_long: { top_k: number; max_tokens: number; temperature: number };
  search: { base_score_threshold: number; ultra_score_threshold: number };
};

// ==================== 상태 ====================
const isOpen = ref(props.defaultOpen ?? false);
const isLoading = ref(false);
const statusMsg = ref("");
const statusType = ref<"success" | "error">("success");
const serverConfig = ref<RagConfig | null>(null);
const selectedTab = ref<"short" | "long" | "ultra" | "search">("short");

const tabs = [
  { value: "short", label: "단문형" },
  { value: "long", label: "장문형" },
  { value: "ultra", label: "초장문형" },
  { value: "search", label: "검색" },
] as const;

// 슬라이더 상태는 채팅(시험 모드)과 공유한다 (composables/useRagDraft.ts)
const { draft, testMode } = useRagDraft();
const short = toRef(draft.value, "short");
const long = toRef(draft.value, "long");
const ultra = toRef(draft.value, "ultra");
const search = toRef(draft.value, "search");
// 서버 값을 한 번이라도 불러왔는지 (페이지를 오가도 작업 중인 슬라이더 값을 덮어쓰지 않기 위함)
const loaded = useState<boolean>("rag-draft-loaded", () => false);

// ==================== 서버 현재값 로드 ====================
onMounted(async () => {
  await loadConfig(!loaded.value);
});

// 열고 닫을 때 슬라이더 값을 서버 값으로 덮어쓰지 않는다 (시험 중인 값 유지)
function togglePanel() {
  isOpen.value = !isOpen.value;
}

// syncSliders=false 이면 "현재 적용값 확인"만 갱신하고 슬라이더는 그대로 둔다
async function loadConfig(syncSliders = true) {
  try {
    const res = await fetch(`${API}/admin/rag-config`);
    if (!res.ok) return;
    const data: RagConfig & { note?: string } = await res.json();
    serverConfig.value = data;
    if (!syncSliders) return;
    loaded.value = true;

    if (data.short) {
      short.value.top_k = data.short.top_k;
      short.value.max_tokens = data.short.max_tokens;
      short.value.temperature = data.short.temperature;
      short.value.context_budget = data.short.context_budget ?? 1024;
    }
    if (data.long) {
      long.value.top_k = data.long.top_k;
      long.value.max_tokens = data.long.max_tokens;
      long.value.temperature = data.long.temperature;
      long.value.context_budget = data.long.context_budget ?? 4096;
    }
    if (data.ultra_long) {
      ultra.value.top_k = data.ultra_long.top_k;
      ultra.value.max_tokens = data.ultra_long.max_tokens;
      ultra.value.temperature = data.ultra_long.temperature;
    }
    if (data.search) {
      search.value.base_score_threshold = data.search.base_score_threshold;
      search.value.ultra_score_threshold = data.search.ultra_score_threshold;
    }
  } catch (e) {
    console.warn("[RagSettings] 설정 로드 실패:", e);
  }
}

// ==================== 적용 ====================
async function applyConfig() {
  if (
    !window.confirm(
      "서버 전체에 적용합니다. 모든 사용자의 다음 질문부터 이 값이 쓰입니다. 계속할까요?",
    )
  )
    return;
  isLoading.value = true;
  statusMsg.value = "";

  try {
    const res = await fetch(`${API}/admin/rag-config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        short_top_k: short.value.top_k,
        short_max_tokens: short.value.max_tokens,
        short_temperature: short.value.temperature,
        short_context_budget: short.value.context_budget,
        long_top_k: long.value.top_k,
        long_max_tokens: long.value.max_tokens,
        long_temperature: long.value.temperature,
        long_context_budget: long.value.context_budget,
        ultra_top_k: ultra.value.top_k,
        ultra_max_tokens: ultra.value.max_tokens,
        ultra_temperature: ultra.value.temperature,
        base_score_threshold: search.value.base_score_threshold,
        ultra_score_threshold: search.value.ultra_score_threshold,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      statusType.value = "success";
      statusMsg.value = "✓ 서버 전체에 적용되었습니다. 모든 사용자의 다음 질문부터 반영됩니다.";
      if (data.current) serverConfig.value = data.current as RagConfig;
    } else {
      statusType.value = "error";
      statusMsg.value = `오류: ${data.detail ?? "적용 실패"}`;
    }
  } catch {
    statusType.value = "error";
    statusMsg.value = "서버 연결 오류";
  } finally {
    isLoading.value = false;
    setTimeout(() => {
      statusMsg.value = "";
    }, 4000);
  }
}

// ==================== 초기화 ====================
async function resetConfig() {
  if (
    !window.confirm(
      "서버 설정을 기본값으로 되돌립니다(모든 사용자에게 적용). 계속할까요?",
    )
  )
    return;
  isLoading.value = true;
  try {
    const res = await fetch(`${API}/admin/rag-config/reset`, {
      method: "POST",
    });
    if (res.ok) {
      await loadConfig(true);
      statusType.value = "success";
      statusMsg.value = "✓ 기본값으로 복원되었습니다.";
    }
  } catch {
    statusType.value = "error";
    statusMsg.value = "초기화 실패";
  } finally {
    isLoading.value = false;
    setTimeout(() => {
      statusMsg.value = "";
    }, 3000);
  }
}
</script>
