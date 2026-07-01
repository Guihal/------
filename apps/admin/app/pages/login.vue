<script setup lang="ts">
import type { LoginRequest } from "~~/api";
import { ApiError } from "~~/api";

definePageMeta({ layout: "auth" });

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive<LoginRequest>({ email: "", password: "" });
const loading = ref(false);
const formError = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

const expired = computed(() => route.query.expired === "1");

async function submit() {
  loading.value = true;
  formError.value = null;
  fieldErrors.value = {};
  try {
    await auth.login({ ...form });
    await router.replace("/");
  } catch (e) {
    formError.value = auth.error ?? "Не удалось войти. Проверьте email и пароль.";
    if (e instanceof ApiError) fieldErrors.value = e.body.field_errors ?? {};
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="wrap">
    <h1 class="title display">Вход в админ-панель</h1>
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
        :error="fieldErrors.email"
      />
      <FormField
        id="password"
        v-model="form.password"
        label="Пароль"
        type="password"
        autocomplete="current-password"
        :error="fieldErrors.password"
      />
      <FieldError :message="formError" />
      <AppButton type="submit" :loading="loading">
        {{ loading ? "Входим…" : "Войти" }}
      </AppButton>
    </form>
  </div>
</template>

<style scoped lang="scss">
.wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.title {
  margin: 0;
  font-size: 1.35rem;
  text-align: center;
}
.banner {
  margin: 0;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-md);
  background: var(--accent-weak);
  color: var(--text);
  font-size: 0.9rem;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
</style>
