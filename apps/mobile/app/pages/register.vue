<script setup lang="ts">
import type { RegisterRequest } from "~~/api";

definePageMeta({ layout: "auth" });

const auth = useAuthStore();
const router = useRouter();

const form = reactive<RegisterRequest>({
  email: "",
  password: "",
  display_name: "",
});
const loading = ref(false);
const formError = ref<string | null>(null);

async function submit() {
  loading.value = true;
  formError.value = null;
  try {
    await auth.register({ ...form });
    await router.replace("/tasks");
  } catch {
    formError.value = auth.error ?? "Не удалось зарегистрироваться.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="wrap">
    <Logo class="brand" :size="72" glow decorative />
    <h1 class="title display">Создать аккаунт</h1>
    <form class="form" novalidate @submit.prevent="submit">
      <FormField
        id="email"
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
      />
      <FormField
        id="password"
        v-model="form.password"
        label="Пароль"
        type="password"
        autocomplete="new-password"
      />
      <FormField
        id="display_name"
        v-model="form.display_name"
        label="Отображаемое имя"
        autocomplete="nickname"
      />
      <p class="hint">Имя можно изменить позже.</p>
      <AppButton type="submit" :loading="loading">
        {{ loading ? "Создаём…" : "Создать аккаунт" }}
      </AppButton>
      <p v-if="formError" class="err" role="alert">{{ formError }}</p>
    </form>
    <NuxtLink to="/login" class="link">Уже есть аккаунт? Войти</NuxtLink>
  </div>
</template>

<style scoped lang="scss">
.wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.brand {
  margin: 0 auto 0.25rem;
}
.title {
  margin: 0;
  font-size: 1.5rem;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.hint {
  margin: -0.25rem 0 0;
  color: var(--muted);
  font-size: 0.8rem;
}
.err {
  margin: 0;
  color: var(--error);
  font-size: 0.85rem;
}
.link {
  text-align: center;
}
</style>
