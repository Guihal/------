<template>
  <div>
    <h1 class="mb-4 text-xl font-bold">Настройки</h1>

    <LoadingState v-if="settingsStore.loading && !settingsStore.settings" />
    <ErrorState
      v-else-if="settingsStore.error && !settingsStore.settings"
      :message="settingsStore.error"
      :on-retry="settingsStore.fetchSettings"
    />

    <template v-else-if="settingsStore.settings">
      <div class="space-y-4 rounded-lg bg-white p-6 shadow">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Тема</label>
          <select
            v-model="form.theme"
            class="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="light">Светлая</option>
            <option value="dark">Темная</option>
            <option value="system">Системная</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Язык</label>
          <select
            v-model="form.language"
            class="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>

        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700">Уведомления</label>
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
          <label class="mb-1 block text-sm font-medium text-gray-700">Время напоминания</label>
          <input
            v-model="form.reminder_time"
            type="time"
            class="w-full rounded border border-gray-300 px-3 py-2"
          />
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
            to="/settings/reminders"
            class="rounded bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
          >
            Напоминания
          </NuxtLink>
        </div>
      </div>

      <div class="mt-6 rounded-lg bg-white p-6 shadow">
        <h2 class="mb-4 text-lg font-bold">Визуальная часть</h2>
        <VisualStateDisplay />
      </div>
    </template>

    <EmptyState v-else message="Настройки не загружены" />
  </div>
</template>

<script setup lang="ts">
import type { AppSettings } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const settingsStore = useSettingsStore()
const saving = ref(false)

const form = reactive<AppSettings>({
  theme: 'system',
  language: 'ru',
  notifications_enabled: true,
  reminder_time: null,
})

watch(
  () => settingsStore.settings,
  (s) => {
    if (s) {
      form.theme = s.theme
      form.language = s.language
      form.notifications_enabled = s.notifications_enabled
      form.reminder_time = s.reminder_time
    }
  },
  { immediate: true },
)

async function handleSave() {
  saving.value = true
  const ok = await settingsStore.saveSettings({
    theme: form.theme,
    language: form.language,
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
