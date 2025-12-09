// composables/useChatStore.ts
import { ref, computed } from "vue";
import type { ChatMessage } from "@/composables/useApi";
import { generateId } from "@/utils/uuid";

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  selectedDocIds: string[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "kinaci_chat_sessions";
const CURRENT_SESSION_KEY = "kinaci_current_session";
const isClient = typeof window !== "undefined";

// 실제 store 생성 로직을 분리
function createChatStore() {
  const currentSessionId = ref<string | null>(null);
  const sessions = ref<Map<string, ChatSession>>(new Map());

  const currentSession = computed(() => {
    if (!currentSessionId.value) return null;
    return sessions.value.get(currentSessionId.value) || null;
  });

  const messages = computed(() => currentSession.value?.messages || []);
  const selectedDocIds = computed(
    () => currentSession.value?.selectedDocIds || []
  );

  const loadFromStorage = () => {
    if (!isClient) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, ChatSession>;
        const m = new Map<string, ChatSession>();
        for (const [id, session] of Object.entries(parsed)) {
          m.set(id, {
            ...session,
            selectedDocIds: session.selectedDocIds || [],
          });
        }
        sessions.value = m;
      }

      const currentId = sessionStorage.getItem(CURRENT_SESSION_KEY);
      if (currentId && sessions.value.has(currentId)) {
        currentSessionId.value = currentId;
      }
    } catch (e) {
      console.error("[ChatStore] Failed to load from storage:", e);
    }
  };

  const saveToStorage = () => {
    if (!isClient) return;

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

  // Map 조작할 때는 항상 새 Map으로 교체해서 반응성 보장
  const setSessions = (updater: (prev: Map<string, ChatSession>) => void) => {
    const next = new Map(sessions.value);
    updater(next);
    sessions.value = next;
  };

  const createSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      messages: [],
      selectedDocIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSessions((m) => {
      m.set(newSession.id, newSession);
    });

    currentSessionId.value = newSession.id;
    saveToStorage();
    return newSession;
  };

  const switchSession = (sessionId: string) => {
    if (sessions.value.has(sessionId)) {
      currentSessionId.value = sessionId;
      if (isClient) {
        sessionStorage.setItem(CURRENT_SESSION_KEY, sessionId);
      }
    }
  };

  const addMessage = (message: ChatMessage) => {
    const cs = currentSession.value;
    if (!cs) return;

    cs.messages.push(message);
    cs.updatedAt = new Date().toISOString();
    // Map 안 객체를 직접 바꿨으니 한 번 더 세션 갱신
    setSessions((m) => {
      m.set(cs.id, { ...cs });
    });
    saveToStorage();
  };

  const setSelectedDocs = (docIds: string[]) => {
    const cs = currentSession.value;
    if (!cs) return;

    cs.selectedDocIds = [...docIds];
    cs.updatedAt = new Date().toISOString();
    setSessions((m) => {
      m.set(cs.id, { ...cs });
    });
    saveToStorage();
  };

  const addSelectedDoc = (docId: string) => {
    const cs = currentSession.value;
    if (!cs) return;

    if (!cs.selectedDocIds.includes(docId)) {
      cs.selectedDocIds.push(docId);
      cs.updatedAt = new Date().toISOString();
      setSessions((m) => {
        m.set(cs.id, { ...cs });
      });
      saveToStorage();
    }
  };

  const removeSelectedDoc = (docId: string) => {
    const cs = currentSession.value;
    if (!cs) return;

    cs.selectedDocIds = cs.selectedDocIds.filter((id) => id !== docId);
    cs.updatedAt = new Date().toISOString();
    setSessions((m) => {
      m.set(cs.id, { ...cs });
    });
    saveToStorage();
  };

  const toggleSelectedDoc = (docId: string) => {
    const cs = currentSession.value;
    if (!cs) return;

    if (cs.selectedDocIds.includes(docId)) {
      cs.selectedDocIds = cs.selectedDocIds.filter((id) => id !== docId);
    } else {
      cs.selectedDocIds = [...cs.selectedDocIds, docId];
    }
    cs.updatedAt = new Date().toISOString();
    setSessions((m) => {
      m.set(cs.id, { ...cs });
    });
    saveToStorage();
  };

  const deleteSession = (sessionId: string) => {
    setSessions((m) => {
      m.delete(sessionId);
    });

    if (currentSessionId.value === sessionId) {
      const sorted = Array.from(sessions.value.values()).sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      if (sorted.length > 0 && sorted[0]) {
        currentSessionId.value = sorted[0].id;
      } else {
        createSession();
      }
    }

    saveToStorage();
  };

  // 초기 로딩
  loadFromStorage();

  // 세션 선택 전략:
  // 1) currentSessionId가 있으면 그걸 사용
  // 2) 없는데 세션들이 있다면, updatedAt 기준으로 "가장 최근 세션"을 선택
  // 3) 세션 자체가 하나도 없으면 그때만 createSession()
  if (!currentSessionId.value) {
    if (sessions.value.size > 0) {
      const latest = Array.from(sessions.value.values()).sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
      if (latest) {
        currentSessionId.value = latest.id;
        if (isClient) {
          sessionStorage.setItem(CURRENT_SESSION_KEY, latest.id);
        }
      }
    } else {
      createSession();
    }
  }

  return {
    currentSessionId,
    sessions,
    currentSession,
    messages,
    selectedDocIds,
    createSession,
    switchSession,
    addMessage,
    deleteSession,
    setSelectedDocs,
    addSelectedDoc,
    removeSelectedDoc,
    toggleSelectedDoc,
  };
}

// 여기에서 싱글톤 유지
let _chatStore: ReturnType<typeof createChatStore> | null = null;

export const useChatStore = () => {
  if (!_chatStore) {
    _chatStore = createChatStore();
  }
  return _chatStore;
};
