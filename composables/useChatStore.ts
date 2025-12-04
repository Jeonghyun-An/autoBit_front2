// composables/useChatStore.ts
import { ref, computed } from "vue";
import type { ChatMessage } from "@/composables/useApi";
import { generateId } from "@/utils/uuid";

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "kinaci_chat_sessions";
const CURRENT_SESSION_KEY = "kinaci_current_session";

export const useChatStore = () => {
  const currentSessionId = ref<string | null>(null);
  const sessions = ref<Map<string, ChatSession>>(new Map());

  const currentSession = computed(() => {
    if (!currentSessionId.value) return null;
    return sessions.value.get(currentSessionId.value) || null;
  });

  const messages = computed(() => currentSession.value?.messages || []);

  // 로컬스토리지에서 복원
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        sessions.value = new Map(
          Object.entries(parsed).map(([id, session]: [string, any]) => [
            id,
            session,
          ])
        );
      }

      const currentId = sessionStorage.getItem(CURRENT_SESSION_KEY);
      if (currentId && sessions.value.has(currentId)) {
        currentSessionId.value = currentId;
      }
    } catch (e) {
      console.error("[ChatStore] Failed to load from storage:", e);
    }
  };

  // 로컬스토리지에 저장
  const saveToStorage = () => {
    try {
      const obj = Object.fromEntries(sessions.value);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));

      if (currentSessionId.value) {
        sessionStorage.setItem(CURRENT_SESSION_KEY, currentSessionId.value);
      }
    } catch (e) {
      console.error("[ChatStore] Failed to save to storage:", e);
    }
  };

  // 새 세션 생성
  const createSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    sessions.value.set(newSession.id, newSession);
    currentSessionId.value = newSession.id;
    saveToStorage();
    return newSession;
  };

  // 세션 전환
  const switchSession = (sessionId: string) => {
    if (sessions.value.has(sessionId)) {
      currentSessionId.value = sessionId;
      sessionStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    }
  };

  // 메시지 추가
  const addMessage = (message: ChatMessage) => {
    if (!currentSession.value) return;

    currentSession.value.messages.push(message);
    currentSession.value.updatedAt = new Date().toISOString();
    saveToStorage();
  };

  // 세션 삭제
  const deleteSession = (sessionId: string) => {
    sessions.value.delete(sessionId);

    if (currentSessionId.value === sessionId) {
      // 다른 세션으로 전환 또는 새로 생성
      if (sessions.value.size > 0) {
        const sorted = Array.from(sessions.value.values()).sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        // 🔹 수정: sorted 배열에 요소가 있는지 확인
        if (sorted.length > 0 && sorted[0]) {
          currentSessionId.value = sorted[0].id;
        } else {
          createSession();
        }
      } else {
        createSession();
      }
    }

    saveToStorage();
  };

  // 초기화
  loadFromStorage();

  // 자동 세션 생성
  if (!currentSessionId.value) {
    createSession();
  }

  return {
    currentSessionId,
    sessions,
    currentSession,
    messages,
    createSession,
    switchSession,
    addMessage,
    deleteSession,
  };
};
