<template>
  <div class="px-3 py-2">
    <div class="max-w-5xl mx-auto">
      <!-- 답변 모드 선택 버튼 (Textarea 위에 배치) -->
      <div class="mb-2 flex items-center gap-2">
        <span class="text-xs text-zinc-500 font-medium">답변 모드:</span>
        <div
          class="inline-flex rounded-lg border border-slate-300 bg-white overflow-hidden"
        >
          <button
            type="button"
            :class="[
              'px-4 py-1.5 text-sm font-medium transition-colors',
              responseType === 'short'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100',
            ]"
            @click="responseType = 'short'"
          >
            단문형
          </button>
          <button
            type="button"
            :class="[
              'px-4 py-1.5 text-sm font-medium transition-colors border-l border-slate-300',
              responseType === 'long'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100',
            ]"
            @click="responseType = 'long'"
          >
            장문형
          </button>
        </div>
        <span class="text-xs text-zinc-500">
          {{
            responseType === "short"
              ? "(간결한 답변, 빠른 응답)"
              : "(상세한 답변, 더 많은 컨텍스트)"
          }}
        </span>
      </div>

      <!-- 채팅창과 버튼을 나란히 배치 -->
      <div class="flex items-end gap-3">
        <!-- STT 버튼 -->
        <button
          type="button"
          :class="[
            'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all',
            isListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-zinc-200 hover:bg-zinc-300',
          ]"
          :disabled="disabled"
          :title="isListening ? '음성 인식 중지' : '음성으로 입력'"
          @click="toggleSpeechRecognition"
        >
          <Icon
            :name="isListening ? 'mdi:microphone' : 'mdi:microphone-outline'"
            :class="['w-6 h-6', isListening ? 'text-white' : 'text-zinc-700']"
          />
        </button>

        <!-- Textarea 영역 -->
        <textarea
          ref="taRef"
          :class="[
            'flex-1 resize-none rounded-3xl text-black placeholder-zinc-500 p-3 pr-0 focus:outline-none focus:ring-2 focus:ring-slate-900 border border-slate-900',
            isOverflowing ? 'scrollbar-visible' : 'scrollbar-hidden',
          ]"
          rows="1"
          style="scrollbar-gutter: stable; line-height: 1.5rem"
          :placeholder="
            disabled
              ? '챗봇 가동중... 잠시만 기다려주세요.'
              : isListening
              ? '음성을 인식하고 있습니다...'
              : '질문을 입력하세요. 무엇이 궁금한가요?'
          "
          v-model="value"
          :disabled="disabled"
          @keydown="onKeyDown"
        />

        <!-- 전송 버튼: 항상 하단에 고정 -->
        <button
          type="button"
          class="flex-shrink-0 w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          :disabled="disabled || !value.trim()"
          title="전송 (Enter)"
          @click="submit"
        >
          <Icon name="mingcute:send-plane-fill" class="w-6 h-6 text-white" />
        </button>
      </div>

      <!-- 안내 텍스트 -->
      <div
        class="mt-2 flex items-center justify-between text-xs text-zinc-500 text-opacity-90"
      >
        <div class="flex items-center gap-2">
          <span>STT 언어:</span>
          <select
            v-model="sttLang"
            class="text-xs px-1.5 py-0.5 rounded border border-zinc-300 bg-zinc-100 text-zinc-500 focus:outline-none focus:ring-1 focus:ring-slate-900 hover:bg-white"
            @change="onLanguageChange"
          >
            <option value="ko-KR">한국어</option>
            <option value="en-US">English</option>
          </select>
          <span v-if="!speechSupported" class="text-zinc-300">
            음성 인식을 지원하지 않는 브라우저입니다
          </span>
        </div>
        <span>Enter: 전송 · Shift+Enter: 줄바꿈</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";

const emit = defineEmits<{
  (e: "send", text: string, responseType: "short" | "long"): void;
  (e: "height-changed", height: number): void;
}>();
const props = withDefaults(
  defineProps<{ disabled?: boolean; maxRows?: number }>(),
  { maxRows: 8 }
);

const value = ref("");
const taRef = ref<HTMLTextAreaElement | null>(null);
const responseType = ref<"short" | "long">("short");
const isOverflowing = ref(false);

// STT 관련 상태
const isListening = ref(false);
const recognition = ref<any>(null);
const speechSupported = ref(false);
const sttLang = ref<string>("ko-KR");

// 답변 모드 변경 시 localStorage 저장
watch(responseType, (newType) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("rag_response_type", newType);
  }
});

// STT 언어 변경 시 localStorage 저장
watch(sttLang, (newLang) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("rag_stt_lang", newLang);
  }
});

function autoresize() {
  const ta = taRef.value;
  if (!ta) return;

  ta.style.height = "0px";
  const lineHeight = parseFloat(getComputedStyle(ta).lineHeight || "24");
  const paddingY =
    parseFloat(getComputedStyle(ta).paddingTop || "0") +
    parseFloat(getComputedStyle(ta).paddingBottom || "0");
  const maxPx = props.maxRows * lineHeight + paddingY;

  isOverflowing.value = ta.scrollHeight > maxPx;
  ta.style.height = Math.min(ta.scrollHeight, maxPx) + "px";

  if (isOverflowing.value) {
    ta.style.overflowY = "auto";
  } else {
    ta.style.overflowY = "hidden";
  }

  emit("height-changed", ta.offsetHeight);
}

watch(value, () => autoresize());

function submit() {
  const v = value.value.trim();
  if (!v) return;

  // 음성 인식 중이면 중지
  if (isListening.value) {
    stopSpeechRecognition();
  }

  emit("send", v, responseType.value);
  value.value = "";
  autoresize();
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!props.disabled) submit();
  }
}

function onResize() {
  autoresize();
}

function focus() {
  taRef.value?.focus();
}

defineExpose({
  focus,
});

// STT 기능
function initSpeechRecognition() {
  if (typeof window === "undefined") return;

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    speechSupported.value = false;
    console.warn("[STT] Speech Recognition API not supported");
    return;
  }

  speechSupported.value = true;
  recognition.value = new SpeechRecognition();

  // 언어 설정 (동적)
  recognition.value.lang = sttLang.value;

  // 연속 인식 (계속 듣기)
  recognition.value.continuous = true;

  // 중간 결과도 반환
  recognition.value.interimResults = true;

  // 최대 대안 개수
  recognition.value.maxAlternatives = 1;

  // 이벤트 핸들러
  recognition.value.onstart = () => {
    console.log("[STT] Started with lang:", sttLang.value);
    isListening.value = true;
  };

  recognition.value.onend = () => {
    console.log("[STT] Ended");
    isListening.value = false;
  };

  recognition.value.onerror = (event: any) => {
    console.error("[STT] Error:", event.error);
    isListening.value = false;

    if (event.error === "no-speech") {
      console.warn("[STT] No speech detected");
    } else if (event.error === "audio-capture") {
      alert("마이크를 사용할 수 없습니다. 마이크 권한을 확인해주세요.");
    } else if (event.error === "not-allowed") {
      alert(
        "마이크 접근이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요."
      );
    }
  };

  recognition.value.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // 최종 결과가 있으면 텍스트에 추가
    if (finalTranscript) {
      // 기존 텍스트가 있으면 띄어쓰기 추가
      if (value.value.trim()) {
        value.value += " " + finalTranscript.trim();
      } else {
        value.value = finalTranscript.trim();
      }

      console.log("[STT] Final:", finalTranscript);
      autoresize();
    }

    // 중간 결과 로그 (선택사항)
    if (interimTranscript) {
      console.log("[STT] Interim:", interimTranscript);
    }
  };
}

function toggleSpeechRecognition() {
  if (!speechSupported.value) {
    alert(
      "이 브라우저는 음성 인식을 지원하지 않습니다.\nChrome, Edge, Safari를 사용해주세요."
    );
    return;
  }

  if (isListening.value) {
    stopSpeechRecognition();
  } else {
    startSpeechRecognition();
  }
}

function startSpeechRecognition() {
  if (!recognition.value) return;

  try {
    // 시작 전 언어 업데이트
    recognition.value.lang = sttLang.value;
    recognition.value.start();
  } catch (error) {
    console.error("[STT] Start error:", error);
  }
}

function stopSpeechRecognition() {
  if (!recognition.value) return;

  try {
    recognition.value.stop();
  } catch (error) {
    console.error("[STT] Stop error:", error);
  }
}

// 언어 변경 핸들러
function onLanguageChange() {
  console.log("[STT] Language changed to:", sttLang.value);

  // 음성 인식 중이면 재시작
  if (isListening.value) {
    stopSpeechRecognition();
    setTimeout(() => {
      startSpeechRecognition();
    }, 100);
  }
}

onMounted(() => {
  // localStorage에서 저장된 모드 복원
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("rag_response_type");
    if (saved === "short" || saved === "long") {
      responseType.value = saved;
    }

    // STT 언어 복원
    const savedSttLang = localStorage.getItem("rag_stt_lang");
    if (savedSttLang) {
      sttLang.value = savedSttLang;
    }
  }

  // STT 초기화
  initSpeechRecognition();

  autoresize();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);

  // STT 정리
  if (isListening.value) {
    stopSpeechRecognition();
  }
});
</script>

<style scoped>
/* 오버플로우 없을 때: 스크롤바 완전히 숨김 */
.scrollbar-hidden {
  overflow-y: hidden;
  scrollbar-width: none;
}

.scrollbar-hidden::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 오버플로우 있을 때: 스크롤바 표시 */
.scrollbar-visible {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #d4d4d9 transparent;
}

.scrollbar-visible::-webkit-scrollbar {
  width: 8px;
}

.scrollbar-visible::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-visible::-webkit-scrollbar-thumb {
  background: #d4d4d9;
  border-radius: 4px;
}

.scrollbar-visible::-webkit-scrollbar-thumb:hover {
  background: #a1a1aa;
}

.scrollbar-visible::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

/* 마이크 버튼 애니메이션 */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
