<script setup lang="ts">
import type { LoginRequest } from "~~/api";

definePageMeta({ layout: "auth" });

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive<LoginRequest>({ email: "", password: "" });
const loading = ref(false);
const formError = ref<string | null>(null);

const expired = computed(() => route.query.expired === "1");

async function submit() {
  loading.value = true;
  formError.value = null;
  try {
    await auth.login({ ...form });
    await router.replace("/tasks");
  } catch {
    formError.value =
      auth.error ?? "Не удалось войти. Проверьте email и пароль.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="wrap">
    <p class="brand text-grad" aria-hidden="true">TC</p>
    <h1 class="title display">Вход</h1>
    <p v-if="expired" class="banner" role="alert">
      Сессия истекла. Войдите снова.
    </p>
    <form class="form" novalidate @submit.prevent="submit">
      <FormField
        id="email"
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="formError"
      />
      <FormField
        id="password"
        v-model="form.password"
        label="Пароль"
        type="password"
        autocomplete="current-password"
      />
      <AppButton label="Войти" type="submit" :loading="loading">
        {{ loading ? "Входим…" : "Войти" }}
      </AppButton>
    </form>
    <NuxtLink to="/register" class="link">Создать аккаунт</NuxtLink>
  </div>
</template>

<style scoped lang="scss">
.wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.brand {
  margin: 0 0 0.25rem;
  font-weight: 800;
  font-size: 2.5rem;
  letter-spacing: -0.04em;
  text-align: center;
}
.title {
  margin: 0;
  font-size: 1.5rem;
}
.banner {
  margin: 0;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  background: var(--accent-weak);
  color: var(--text);
  font-size: 0.9rem;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.link {
  text-align: center;
}
</style>
