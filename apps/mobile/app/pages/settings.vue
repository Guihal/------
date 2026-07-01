<script setup lang="ts">
definePageMeta({ middleware: "auth" });
const store = useSettingsStore();
const visual = useVisualStore();

const settings = computed(() => store.settings);

async function save<K extends keyof NonNullable<typeof settings.value>>(
  key: K,
  value: NonNullable<typeof settings.value>[K],
) {
  await store.patch({ [key]: value }).catch(() => {});
  if (key === "disable_visual_randomness") await visual.load();
}

onMounted(() => {
  void store.load();
});
</script>

<template>
  <section class="wrap">
    <div class="title">
      <p>Настройки</p>
      <h1>Приложение</h1>
    </div>
    <p v-if="store.error" class="state error" role="alert" aria-live="assertive">
      {{ store.error }}
    </p>
    <p v-if="store.loading" class="state" role="status">Настройки загружаются…</p>
    <template v-if="settings">
      <SettingsToggle
        label="Уведомления"
        description="Разрешить будущие напоминания. Push-доставка появится в P15."
        :model-value="settings.notifications_enabled"
        :disabled="store.saving"
        @update:model-value="save('notifications_enabled', $event)"
      />
      <ReminderOffsetField
        :value="settings.default_reminder_minutes_before_deadline"
        :disabled="store.saving"
        @save="save('default_reminder_minutes_before_deadline', $event)"
      />
      <SettingsToggle
        label="Стабильное оформление"
        description="Отключает визуальную вариативность и использует спокойный fallback."
        :model-value="settings.disable_visual_randomness"
        :disabled="store.saving"
        @update:model-value="save('disable_visual_randomness', $event)"
      />
      <SettingsToggle
        label="Меньше движения"
        description="Убирает необязательные переходы и сильное свечение."
        :model-value="settings.reduced_motion"
        :disabled="store.saving"
        @update:model-value="save('reduced_motion', $event)"
      />
    </template>
  </section>
</template>

<style scoped lang="scss">
.wrap { display: grid; gap: 0.85rem; padding-top: 0.9rem; }
.title p, .title h1 { margin: 0; }
.title p { color: var(--muted); }
.title h1 { font-size: 1.55rem; }
.state { margin: 0; padding: 0.85rem; border: 1px solid var(--stroke); border-radius: var(--radius-lg); background: var(--surface); }
.error { color: var(--danger); }
</style>
