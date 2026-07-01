<script setup lang="ts">
defineProps<{ id?: string; message?: string | null }>();
</script>

<template>
  <p v-if="message" :id="id" class="err" role="alert">{{ message }}</p>
</template>

<style scoped lang="scss">
.err {
  margin: 0;
  color: var(--danger);
  font-size: 0.8rem;
}
</style>
