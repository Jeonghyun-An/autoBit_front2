// composables/useAdminAccess.ts
// 관리자 여부 확인
// - 운영 Gateway 는 관리자 IP 요청에만 /llama/admin/* 를 열어 준다(그 외 403).
// - 관리자 경로를 한 번 조회해 응답이 200 이면 관리자, 그 외(403·503·네트워크 오류)는 일반 사용자로 본다.
// - 화면에서 버튼을 숨기는 용도일 뿐이고, 실제 차단은 Gateway·FastAPI 가 한다.

let inflight: Promise<boolean> | null = null;

export function useAdminAccess() {
  const config = useRuntimeConfig();
  const API = (config.public.apiBase || "/llama").replace(/\/+$/, "");

  const isAdmin = useState<boolean>("admin-access", () => false);
  const checked = useState<boolean>("admin-access-checked", () => false);

  async function checkAdmin(): Promise<boolean> {
    if (checked.value) return isAdmin.value;
    if (!inflight) {
      inflight = fetch(`${API}/admin/rag-config`, { cache: "no-store" })
        .then((r) => r.ok)
        .catch(() => false)
        .then((ok) => {
          isAdmin.value = ok;
          checked.value = true;
          inflight = null;
          return ok;
        });
    }
    return inflight;
  }

  return { isAdmin, checkAdmin };
}
