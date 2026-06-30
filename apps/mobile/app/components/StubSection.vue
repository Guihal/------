<script setup lang="ts">
defineProps<{ title: string; note?: string }>();
</script>

<template>
  <section class="stub" aria-live="polite">
    <h1 class="title">{{ title }}</h1>
    <p class="text">Раздел в разработке.</p>
    <p v-if="note" class="note">{{ note }}</p>
  </section>
</template>

<style scoped lang="scss">
.stub {
  padding-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.title {
  margin: 0;
  font-size: 1.4rem;
}
.text {
  margin: 0;
  color: var(--text);
}
.note {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
