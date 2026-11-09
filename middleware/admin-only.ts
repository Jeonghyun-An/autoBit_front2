// middleware/admin-only.ts
// 관리자 페이지(/admin, /admin/training) 진입 확인.
// 관리자 경로(/admin/rag-config)가 200 이면 관리자, 그 외(403·503·오류)는 사용자 화면(/chat)으로 보낸다.
// 화면 이동을 막는 보조 장치일 뿐이고, 실제 차단은 Gateway(관리자 IP)와 FastAPI(인증값)가 한다.
export default defineNuxtRouteMiddleware(async () => {
  const { checkAdmin } = useAdminAccess();
  if (!(await checkAdmin())) {
    return navigateTo("/chat");
  }
});
