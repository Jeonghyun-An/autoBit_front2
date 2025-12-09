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
        const parsed = JSON.parse(stored);
        sessions.value = new Map(
          Object.entries(parsed).map(([id, session]: [string, any]) => [
            id,
            {
              ...session,
              selectedDocIds: session.selectedDocIds || [],
            },
          ])
        );
      }

      let currentId = sessionStorage.getItem(CURRENT_SESSION_KEY);

      // currentId 가 없거나, 이미 삭제된 세션이면 → 최신 세션으로 fallback
      if (!currentId || !sessions.value.has(currentId)) {
        if (sessions.value.size > 0) {
          const sorted = Array.from(sessions.value.values()).sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          currentId = sorted[0]?.id ?? null;
        } else {
          currentId = null;
        }
      }

      currentSessionId.value = currentId;
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

  const createSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      messages: [],
      selectedDocIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    sessions.value.set(newSession.id, newSession);
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
    if (!currentSession.value) return;
    currentSession.value.messages.push(message);
    currentSession.value.updatedAt = new Date().toISOString();
    saveToStorage();
  };

  const setSelectedDocs = (docIds: string[]) => {
    if (!currentSession.value) return;
    currentSession.value.selectedDocIds = [...docIds];
    currentSession.value.updatedAt = new Date().toISOString();
    saveToStorage();
  };

  const addSelectedDoc = (docId: string) => {
    if (!currentSession.value) return;
    if (!currentSession.value.selectedDocIds.includes(docId)) {
      currentSession.value.selectedDocIds.push(docId);
      currentSession.value.updatedAt = new Date().toISOString();
      saveToStorage();
    }
  };

  const removeSelectedDoc = (docId: string) => {
    if (!currentSession.value) return;
    const index = currentSession.value.selectedDocIds.indexOf(docId);
    if (index > -1) {
      currentSession.value.selectedDocIds.splice(index, 1);
      currentSession.value.updatedAt = new Date().toISOString();
      saveToStorage();
    }
  };

  const toggleSelectedDoc = (docId: string) => {
    if (!currentSession.value) return;
    const index = currentSession.value.selectedDocIds.indexOf(docId);
    if (index > -1) {
      currentSession.value.selectedDocIds.splice(index, 1);
    } else {
      currentSession.value.selectedDocIds.push(docId);
    }
    currentSession.value.updatedAt = new Date().toISOString();
    saveToStorage();
  };

  const deleteSession = (sessionId: string) => {
    sessions.value.delete(sessionId);

    if (currentSessionId.value === sessionId) {
      if (sessions.value.size > 0) {
        const sorted = Array.from(sessions.value.values()).sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        currentSessionId.value = sorted[0]?.id ?? null;
      } else {
        createSession();
      }
    }

    saveToStorage();
  };

  // 초기화
  loadFromStorage();
  if (!currentSessionId.value) {
    createSession();
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

// 싱글톤
let _store: ReturnType<typeof createChatStore> | null = null;
export const useChatStore = () => {
  if (!_store) _store = createChatStore();
  return _store;
};
