import type { Task, TaskCreateRequest, TaskListQuery, TaskStatus } from "~~/api";

export function useTaskPage() {
  const store = useTasksStore();
  const visual = useVisualStore();
  const profile = useProfileStore();
  const status = ref<TaskStatus | "all">("active");
  const sort = ref<NonNullable<TaskListQuery["sort"]>>("overdue");
  const categoryId = ref("");
  const formTask = ref<Task | null>(null);
  const formOpen = ref(false);
  const saving = ref(false);
  const formError = ref<string | null>(null);
  const headingText = computed(() => visual.current.task_list_heading);
  const ctaText = computed(() => visual.current.task_button_text);
  const emptyText = computed(() => visual.current.empty_state_text);

  const query = computed<TaskListQuery>(() => ({
    status: status.value,
    sort: sort.value,
    limit: 50,
    ...(categoryId.value ? { category_id: categoryId.value } : {}),
  }));
  const categoryMap = computed(() =>
    Object.fromEntries(store.categories.map((c) => [c.id, c.title])),
  );

  watch([status, sort, categoryId], () => {
    void loadTasks().catch(() => {});
  });
  onMounted(async () => {
    await Promise.allSettled([visual.load(), store.loadCategories(), loadTasks()]);
  });

  async function loadTasks() {
    await store.load(query.value);
  }

  function categoryTitle(task: Task | null) {
    if (!task?.category_id) return "общее";
    return categoryMap.value[task.category_id] ?? "общее";
  }

  function openCreate() {
    formTask.value = null;
    formError.value = null;
    formOpen.value = true;
  }

  function openEdit(task: Task) {
    formTask.value = task;
    formError.value = null;
    store.selected = null;
    formOpen.value = true;
  }

  async function openDetails(task: Task) {
    try {
      await store.get(task.id);
    } catch {
      await loadTasks().catch(() => {});
    }
  }

  async function saveTask(body: TaskCreateRequest) {
    saving.value = true;
    formError.value = null;
    try {
      if (formTask.value) await store.patch(formTask.value.id, body);
      else await store.create(body);
      formOpen.value = false;
      await loadTasks();
    } catch {
      formError.value = store.error ?? "Не удалось сохранить задачу. Попробуйте ещё раз?";
    } finally {
      saving.value = false;
    }
  }

  async function completeTask(task: Task) {
    try {
      const res = await store.complete(task.id);
      if (res?.visual_state) visual.apply(res.visual_state);
      if (res) profile.applyProgression(res.progression_after);
      if (res) await loadTasks();
    } catch {
      // Store keeps the Russian error visible.
    }
  }

  async function archiveTask(task: Task) {
    try {
      const res = await store.archive(task.id);
      if (res) await loadTasks();
    } catch {
      // Store keeps the Russian error visible.
    }
  }

  return {
    store,
    status,
    sort,
    categoryId,
    formTask,
    formOpen,
    saving,
    formError,
    headingText,
    ctaText,
    emptyText,
    categoryTitle,
    openCreate,
    openEdit,
    openDetails,
    saveTask,
    completeTask,
    archiveTask,
  };
}
