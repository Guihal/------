export default defineNuxtPlugin(async () => {
  if (process.client) {
    const auth = useAuthStore()
    await auth.init()
  }
})
