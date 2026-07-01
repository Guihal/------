// Guard private routes. Bootstrap is awaited in plugins/api.client.ts,
// so by the time middleware runs `status` is already final. The role check
// is defense-in-depth: the auth store already refuses to create a session
// for non-admin accounts.
export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore();
  if (!auth.isAuthenticated || auth.user?.role !== "admin") {
    return navigateTo("/login");
  }
});
