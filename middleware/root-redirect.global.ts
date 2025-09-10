export default defineNuxtRouteMiddleware((to) => {
  if (to.path === "/") {
    return navigateTo("/chat", { redirectCode: 302, replace: true });
  }
});
