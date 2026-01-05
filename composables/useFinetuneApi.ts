// composables/useFinetuneApi.ts
/**
 * 파인튜닝 API 호출 Composable
 */
import { ref, computed } from "vue";

export type FinetuneConfig = {
  doc_ids: string[];
  model_name?: string;
  lora_r?: number;
  lora_alpha?: number;
  num_epochs?: number;
  batch_size?: number;
  learning_rate?: number;
  output_name?: string;
};

export type FinetuneStatus = {
  job_id: string;
  status: "pending" | "extracting" | "training" | "completed" | "failed";
  progress: number;
  current_step?: string;
  doc_ids: string[];
  dataset_size?: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
  output_path?: string;
};

export type FinetuneModel = {
  name: string;
  path: string;
  base_model: string;
  created_at: string;
  dataset_size?: number;
  doc_ids?: string[];
  config?: Record<string, any>;
};

export function useFinetuneApi() {
  const config = useRuntimeConfig();
  const API = (config.public.apiBase || "/llama").replace(/\/+$/, "");

  /**
   * 파인튜닝 시작
   */
  async function startFinetuning(
    config: FinetuneConfig
  ): Promise<{ job_id: string; message: string }> {
    const url = `${API}/finetune/start`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`파인튜닝 시작 실패: ${error}`);
    }

    return await res.json();
  }

  /**
   * 파인튜닝 상태 조회
   */
  async function getFinetuningStatus(job_id: string): Promise<FinetuneStatus> {
    const url = `${API}/finetune/status/${encodeURIComponent(job_id)}`;
    const res = await fetch(url);

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`상태 조회 실패: ${error}`);
    }

    return await res.json();
  }

  /**
   * 모든 파인튜닝 작업 목록
   */
  async function listFinetuningJobs(): Promise<FinetuneStatus[]> {
    const url = `${API}/finetune/jobs`;
    const res = await fetch(url);

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`작업 목록 조회 실패: ${error}`);
    }

    return await res.json();
  }

  /**
   * 파인튜닝된 모델 목록 조회
   */
  async function listFinetunedModels(): Promise<FinetuneModel[]> {
    const url = `${API}/finetune/models`;
    const res = await fetch(url);
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`모델 목록 조회 실패: ${error}`);
    }

    return await res.json();
  }

  /**
   * 파인튜닝 작업 삭제
   */
  async function deleteFinetuningJob(job_id: string): Promise<void> {
    const url = `${API}/finetune/job/${encodeURIComponent(job_id)}`;
    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`작업 삭제 실패: ${error}`);
    }
  }

  return {
    startFinetuning,
    getFinetuningStatus,
    listFinetuningJobs,
    listFinetunedModels,
    deleteFinetuningJob,
  };
}

/**
 * 파인튜닝 상태 폴링 Composable
 */
export function useFinetuningPolling(job_id: string, interval: number = 2000) {
  const { getFinetuningStatus } = useFinetuneApi();
  const status = ref<FinetuneStatus | null>(null);
  const error = ref<string | null>(null);
  const isPolling = ref(false);

  let intervalId: NodeJS.Timeout | null = null;

  const progress = computed(() => status.value?.progress ?? 0);
  const isCompleted = computed(
    () =>
      status.value?.status === "completed" || status.value?.status === "failed"
  );

  async function poll() {
    if (!job_id) return;

    try {
      const result = await getFinetuningStatus(job_id);
      status.value = result;
      error.value = null;

      // 완료되면 폴링 중지
      if (isCompleted.value) {
        stopPolling();
      }
    } catch (e: any) {
      error.value = e.message;
      console.error("파인튜닝 상태 조회 실패:", e);
    }
  }

  function startPolling() {
    if (isPolling.value) return;

    isPolling.value = true;
    poll(); // 즉시 한 번 실행

    intervalId = setInterval(poll, interval);
  }

  function stopPolling() {
    isPolling.value = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Cleanup
  onUnmounted(() => {
    stopPolling();
  });

  return {
    status,
    progress,
    error,
    isPolling,
    isCompleted,
    startPolling,
    stopPolling,
    poll,
  };
}
