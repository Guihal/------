<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}>();
const emit = defineEmits<{ (e: "confirm"): void; (e: "cancel"): void }>();

const dialogEl = ref<HTMLElement | null>(null);
const cancelBtn = ref<{ $el: HTMLElement } | null>(null);
let lastFocused: HTMLElement | null = null;

function focusableEls(): HTMLElement[] {
  if (!dialogEl.value) return [];
  return Array.from(
    dialogEl.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    emit("cancel");
    return;
  }
  if (e.key !== "Tab") return;
  const els = focusableEls();
  if (!els.length) return;
  const first = els[0]!;
  const last = els[els.length - 1]!;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      lastFocused = document.activeElement as HTMLElement | null;
      await nextTick();
      const cancelEl = cancelBtn.value?.$el as HTMLElement | undefined;
      (cancelEl ?? focusableEls()[0])?.focus();
      document.addEventListener("keydown", onKeydown, true);
    } else {
      document.removeEventListener("keydown", onKeydown, true);
      lastFocused?.focus();
      lastFocused = null;
    }
  },
);

onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown, true);
});
</script>

<template>
  <div v-if="props.open" class="backdrop" role="presentation">
    <div
      ref="dialogEl"
      class="dialog"
      role="alertdialog"
      aria-modal="true"
      :aria-label="title"
      tabindex="-1"
    >
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="actions">
        <AppButton ref="cancelBtn" variant="ghost" @click="emit('cancel')">
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
