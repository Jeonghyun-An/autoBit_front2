// composables/useDocsList.ts
import { ref } from "vue";
import type { DocItem } from "@/composables/useApi";

// 전역 상태로 관리 (컴포넌트 간 공유)
const _docs = ref<DocItem[]>([]);
const _hasData = ref(false);
const _isLoading = ref(false);
const _lastFetched = ref<number>(0);

const REFETCH_INTERVAL = 5 * 60 * 1000; // 5분

export function useDocsList() {
  const { listDocs, getStatus } = useApi();

  // 문서 목록 가져오기 (중복 호출 방지)
  async function fetchDocs(force = false) {
    // 이미 로딩 중이면 스킵
    if (_isLoading.value && !force) {
      console.log("[Docs] Already loading, skipping...");
      return;
    }

    // 캐시가 있고 5분 이내면 스킵
    const age = Date.now() - _lastFetched.value;
    if (!force && _docs.value.length > 0 && age < REFETCH_INTERVAL) {
      console.log(`[Docs] Using cached docs (age: ${Math.round(age / 1000)}s)`);
      return;
    }

    _isLoading.value = true;

    try {
      const s = await getStatus();
      _hasData.value = s.has_data;
    } catch {
      _hasData.value = false;
    }

    try {
      const newDocs = await listDocs();
      _docs.value = newDocs;
      _hasData.value = newDocs.length > 0;
      _lastFetched.value = Date.now();
      console.log(`[Docs] Fetched ${newDocs.length} documents`);
    } catch {
      _docs.value = [];
      _hasData.value = false;
    } finally {
      _isLoading.value = false;
    }
  }

  return {
    docs: _docs,
    hasData: _hasData,
    isLoading: _isLoading,
    fetchDocs,
  };
}
