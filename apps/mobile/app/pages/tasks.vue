<script setup lang="ts">
definePageMeta({ middleware: "auth" });
const taskPage = useTaskPage();
</script>

<template>
  <section class="tasks-page">
    <TaskPageHero
      :heading="taskPage.headingText.value"
      :cta="taskPage.ctaText.value"
      @create="taskPage.openCreate"
    />

    <TaskCompleteToast :payload="taskPage.store.completion" />
    <TaskFilters
      v-model:status="taskPage.status.value"
      v-model:sort="taskPage.sort.value"
      v-model:category-id="taskPage.categoryId.value"
      :categories="taskPage.store.categories"
    />

    <p v-if="taskPage.store.loading" class="state" role="status">
      Задачи загружаются…
    </p>
    <p v-else-if="taskPage.store.error" class="state error" role="alert">
      {{ taskPage.store.error }}
    </p>
    <div v-else-if="!taskPage.store.items.length" class="empty" role="status">
      {{ taskPage.emptyText.value }}
    </div>
    <div v-else class="list" aria-label="Список задач">
      <TaskCard
        v-for="task in taskPage.store.items"
        :key="task.id"
        :task="task"
        :category-title="taskPage.categoryTitle(task)"
        :busy="taskPage.store.isMutating"
        @open="taskPage.openDetails"
        @complete="taskPage.completeTask"
        @archive="taskPage.archiveTask"
      />
    </div>

    <TaskFormSheet
      :open="taskPage.formOpen.value"
      :task="taskPage.formTask.value"
      :categories="taskPage.store.categories"
      :saving="taskPage.saving.value"
      :error="taskPage.formError.value"
      @submit="taskPage.saveTask"
      @close="taskPage.formOpen.value = false"
    />

    <TaskDetails
      :task="taskPage.store.selected"
      :category-title="taskPage.categoryTitle(taskPage.store.selected)"
      :busy="taskPage.store.isMutating"
      @close="taskPage.store.selected = null"
      @edit="taskPage.openEdit"
      @complete="taskPage.completeTask"
      @archive="taskPage.archiveTask"
    />
  </section>
</template>

<style scoped lang="scss">
.tasks-page { display: grid; gap: 0.8rem; padding-top: 0.8rem; }
.state, .empty { margin: 0; padding: 0.85rem; border: 1px solid var(--stroke); border-radius: var(--radius-lg); background: var(--surface-card); }
.error {
  color: var(--danger);
}
.empty {
  color: var(--muted);
}
.list {
  display: grid;
  gap: 0.75rem;
}
</style>
