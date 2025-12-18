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
            (disabled || isTranscribing) && 'opacity-50 cursor-not-allowed',
          ]"
          :disabled="disabled || isTranscribing"
          :title="
            isListening ? '녹음 중지 (Whisper)' : '음성으로 입력 (Whisper)'
          "
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
              ? '녹음 중... (버튼 클릭하여 중지)'
              : isTranscribing
              ? '음성 변환 중...'
              : '질문을 입력하세요. 무엇이 궁금한가요?'
          "
          v-model="value"
          :disabled="disabled || isTranscribing"
          @keydown="onKeyDown"
        />

        <!-- 전송 버튼: 항상 하단에 고정 -->
        <button
          type="button"
          class="flex-shrink-0 w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          :disabled="disabled || !value.trim() || isTranscribing"
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
            :disabled="isListening || isTranscribing"
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
          </select>
          <span v-if="!microphoneSupported" class="text-zinc-500 text-xs">
            마이크를 사용할 수 없습니다
          </span>
          <span v-else-if="isTranscribing" class="ttext-zinc-500 font-medium">
            음성 변환 중...
          </span>
          <span v-else-if="sttError" class="text-zinc-500">
            {{ sttError }}
          </span>
        </div>
        <span>Enter: 전송 · Shift+Enter: 줄바꿈</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";

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

// STT 관련 상태 (Whisper 기반)
const isListening = ref(false);
const isTranscribing = ref(false);
const microphoneSupported = ref(true);
const sttLang = ref<string>("ko");
const sttError = ref("");

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

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
    stopRecording();
  }

  emit("send", v, responseType.value);
  value.value = "";
  autoresize();
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!props.disabled && !isTranscribing.value) submit();
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

// ==================== Whisper STT 구현 ====================

// STT API 응답 타입 정의
interface STTResponse {
  text: string;
  language: string;
  duration?: number;
  segments?: any[];
}

async function checkMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) {
    microphoneSupported.value = false;
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop()); // 즉시 해제
    microphoneSupported.value = true;
    return true;
  } catch (error) {
    console.error("[STT] Microphone permission denied:", error);
    microphoneSupported.value = false;
    sttError.value = "마이크 권한이 필요합니다";
    return false;
  }
}

async function startRecording() {
  try {
    sttError.value = "";

    // 마이크 권한 확인
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) {
      alert(
        "마이크 접근 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요."
      );
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // MediaRecorder 생성 (webm 형식, 브라우저 호환성 높음)
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    mediaRecorder = new MediaRecorder(stream, { mimeType });
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      console.log("[STT] Recording stopped, processing...");

      // 스트림 정리
      stream.getTracks().forEach((track) => track.stop());

      // 오디오 Blob 생성
      const audioBlob = new Blob(audioChunks, { type: mimeType });

      // Whisper API로 전송
      await transcribeAudio(audioBlob);
    };

    mediaRecorder.start();
    isListening.value = true;
    console.log("[STT] Recording started");
  } catch (error) {
    console.error("[STT] Failed to start recording:", error);
    sttError.value = "녹음 시작 실패";
    alert("녹음을 시작할 수 없습니다. 마이크를 확인해주세요.");
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    isListening.value = false;
    console.log("[STT] Stopping recording...");
  }
}

async function transcribeAudio(audioBlob: Blob) {
  isTranscribing.value = true;
  sttError.value = "";

  try {
    console.log(`[STT] Sending audio to Whisper API (${audioBlob.size} bytes)`);

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("language", sttLang.value); // ko 또는 en
    formData.append("use_nuclear_context", "true"); // 원자력 전문 용어 사용

    const response = await $fetch<any>("/rag/stt/transcribe", {
      method: "POST",
      body: formData,
      baseURL: "",
      responseType: "json",
    }).catch(async (e) => {
      // 응답이 text로 왔을 가능성도 있어 디버깅용으로 보강
      throw e;
    });

    // 응답 구조 검증
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format");
    }

    const transcribedText = (response.text || "").trim();

    if (transcribedText) {
      // 기존 텍스트에 추가
      if (value.value.trim()) {
        value.value += " " + transcribedText;
      } else {
        value.value = transcribedText;
      }

      console.log("[STT] Transcribed:", transcribedText);
      autoresize();
    } else {
      console.warn("[STT] Empty transcription result");
      sttError.value = "음성을 인식할 수 없습니다";
    }
  } catch (error: any) {
    console.error("[STT] Transcription failed:", error);
    sttError.value = "음성 변환 실패";

    // 에러 상세 로깅
    console.error("[STT] Error details:", {
      message: error?.message,
      statusCode: error?.statusCode,
      data: error?.data,
    });

    if (error?.statusCode === 404) {
      alert(
        "STT API를 찾을 수 없습니다.\n백엔드에 stt_router가 등록되었는지 확인하세요."
      );
    } else if (error?.statusCode === 503) {
      alert(
        "STT 서비스를 사용할 수 없습니다.\nstt-whisper 컨테이너가 실행 중인지 확인하세요."
      );
    } else if (error?.statusCode === 504) {
      alert("음성 변환 시간이 초과되었습니다. 다시 시도해주세요.");
    } else {
      alert(
        `음성 변환 중 오류가 발생했습니다.\n${
          error?.message || "Unknown error"
        }`
      );
    }
  } finally {
    isTranscribing.value = false;
  }
}

function toggleSpeechRecognition() {
  if (props.disabled || isTranscribing.value) return;

  if (!microphoneSupported.value) {
    alert("마이크를 사용할 수 없습니다. 브라우저 설정을 확인해주세요.");
    return;
  }

  if (isListening.value) {
    stopRecording();
  } else {
    startRecording();
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

  // 마이크 지원 확인
  if (typeof navigator !== "undefined" && navigator.mediaDevices) {
    microphoneSupported.value = true;
  } else {
    microphoneSupported.value = false;
  }

  autoresize();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);

  // 녹음 중이면 정리
  if (isListening.value) {
    stopRecording();
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
