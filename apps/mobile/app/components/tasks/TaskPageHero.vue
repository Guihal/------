<script setup lang="ts">
import { Plus } from "lucide-vue-next";

defineProps<{ heading: string; cta: string }>();
const emit = defineEmits<{ create: [] }>();
</script>

<template>
  <div class="hero">
    <div>
      <p class="kicker">Сегодня</p>
      <h1>{{ heading }}</h1>
    </div>
    <button class="create tap" type="button" @click="emit('create')">
      <Plus :size="18" aria-hidden="true" />
      {{ cta }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
}
.kicker, h1 { margin: 0; }
.kicker { color: var(--muted); font-size: 0.82rem; }
h1 { font-size: 1.45rem; }
.create {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--accent-grad);
  color: var(--bg);
  padding: 0 0.75rem;
  font-weight: 900;
}
</style>
