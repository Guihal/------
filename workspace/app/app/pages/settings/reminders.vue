<template>
  <div>
    <h1 class="mb-4 text-xl font-bold">Напоминания</h1>

    <LoadingState v-if="settingsStore.loading && !settingsStore.settings" />
    <ErrorState
      v-else-if="settingsStore.error && !settingsStore.settings"
      :message="settingsStore.error"
      :on-retry="settingsStore.fetchSettings"
    />

    <template v-else-if="settingsStore.settings">
      <div class="space-y-4 rounded-lg bg-white p-6 shadow">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700">Включить напоминания</label>
          <button
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            :class="form.notifications_enabled ? 'bg-blue-600' : 'bg-gray-300'"
            @click="form.notifications_enabled = !form.notifications_enabled"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              :class="form.notifications_enabled ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Время ежедневного напоминания</label>
          <input
            v-model="form.reminder_time"
            type="time"
            :disabled="!form.notifications_enabled"
            class="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
          />
          <p class="mt-1 text-xs text-gray-500">
            В это время придет уведомление о невыполненных задачах
          </p>
        </div>

        <div v-if="settingsStore.saveError" class="text-sm text-red-600">
          {{ settingsStore.saveError }}
        </div>

        <div class="flex gap-2 pt-2">
          <button
            class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            :disabled="saving"
            @click="handleSave"
          >
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
          <NuxtLink
            to="/settings"
            class="rounded bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
          >
            Назад
          </NuxtLink>
        </div>
      </div>
    </template>

    <EmptyState v-else message="Настройки не загружены" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const settingsStore = useSettingsStore()
const saving = ref(false)

const form = reactive({
  notifications_enabled: true,
  reminder_time: null as string | null,
})

watch(
  () => settingsStore.settings,
  (s) => {
    if (s) {
      form.notifications_enabled = s.notifications_enabled
      form.reminder_time = s.reminder_time
    }
  },
  { immediate: true },
)

async function handleSave() {
  saving.value = true
  const ok = await settingsStore.patchSettings({
    notifications_enabled: form.notifications_enabled,
    reminder_time: form.reminder_time,
  })
  saving.value = false
  if (ok) {
    alert('Сохранено')
  }
}

onMounted(() => {
  settingsStore.fetchSettings()
})
</script>
