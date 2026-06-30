// Guard private routes. Bootstrap is awaited in plugins/api.client.ts,
// so by the time middleware runs `status` is already final.
export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore();
  if (!auth.isAuthenticated) {
    return navigateTo("/login");
  }
});
