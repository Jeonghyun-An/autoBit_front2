export default defineNuxtRouteMiddleware((to) => {
  if (to.path === "/") {
    return navigateTo("/chat", { redirectCode: 302, replace: true });
  }
  // 파인튜닝 화면은 관리자 페이지(/admin)로 옮겼다. 예전 주소는 새 주소로 보낸다.
  if (to.path === "/training" || to.path === "/training/") {
    return navigateTo("/admin/training", { redirectCode: 302, replace: true });
  }
});
