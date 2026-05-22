<template>
  <div class="space-y-2">
    <TaskCard
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      @complete="$emit('complete', $event)"
      @archive="$emit('archive', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/types/api'

defineProps<{ tasks: Task[] }>()
defineEmits<{ complete: [id: number]; archive: [id: number] }>()
</script>
