<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}>();
const emit = defineEmits<{ (e: "confirm"): void; (e: "cancel"): void }>();

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("cancel");
}
</script>

<template>
  <div
    v-if="props.open"
    class="backdrop"
    role="presentation"
    @keydown="onKeydown"
  >
    <div
      class="dialog"
      role="alertdialog"
      aria-modal="true"
      :aria-label="title"
    >
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="actions">
        <AppButton variant="ghost" @click="emit('cancel')">
          {{ cancelLabel ?? "Отмена" }}
        </AppButton>
        <AppButton variant="danger" @click="emit('confirm')">
          {{ confirmLabel ?? "Подтвердить" }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}
.dialog {
  width: 100%;
  max-width: 26rem;
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--stroke);
  box-shadow: var(--shadow-card);
}
h2 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}
p {
  margin: 0 0 1rem;
  color: var(--muted);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}
</style>
