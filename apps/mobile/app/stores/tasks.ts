import { defineStore } from "pinia";
import { ApiError } from "~~/api";
import type {
  CompletionPayload,
  Task,
  TaskCategory,
  TaskCreateRequest,
  TaskListQuery,
  TaskPatchRequest,
} from "~~/api";

export const useTasksStore = defineStore("tasks", () => {
  const { api } = useAppClient();
  const items = ref<Task[]>([]);
  const categories = ref<TaskCategory[]>([]);
  const selected = ref<Task | null>(null);
  const completion = ref<CompletionPayload | null>(null);
  const loading = ref(false);
  const mutatingId = ref<string | null>(null);
  const error = ref<string | null>(null);
  const total = ref(0);
  const isMutating = computed(() => mutatingId.value !== null);

  async function load(query?: TaskListQuery) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.tasks.list(query);
      items.value = res.items;
      total.value = res.total;
    } catch (e) {
      error.value = mapTaskError(e, "Не удалось загрузить задачи.");
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function loadCategories() {
    try {
      categories.value = (await api.tasks.categories()).items;
    } catch (e) {
      error.value = mapTaskError(e, "Не удалось загрузить категории.");
    }
  }

  async function get(id: string) {
    try {
      selected.value = await api.tasks.get(id);
      return selected.value;
    } catch (e) {
      error.value = mapTaskError(e, "Не удалось открыть задачу.");
      throw e;
    }
  }

  async function create(body: TaskCreateRequest) {
    try {
      const task = await api.tasks.create(body);
      items.value = [task, ...items.value];
      total.value += 1;
      return task;
    } catch (e) {
      error.value = mapTaskError(e, "Не удалось создать задачу.");
      throw e;
    }
  }

  async function patch(id: string, body: TaskPatchRequest) {
    try {
      const task = await api.tasks.patch(id, body);
      replaceTask(task);
      selected.value = task;
      return task;
    } catch (e) {
      error.value = mapTaskError(e, "Не удалось сохранить задачу.");
      throw e;
    }
  }

  async function complete(id: string) {
    if (mutatingId.value) return null;
    mutatingId.value = id;
    try {
      completion.value = await api.tasks.complete(id);
      applyTaskPatch(completion.value.task);
      return completion.value;
    } catch (e) {
      error.value = mapTaskError(e, "Не удалось выполнить задачу.");
      throw e;
    } finally {
      mutatingId.value = null;
    }
  }

  async function archive(id: string) {
    if (mutatingId.value) return null;
    mutatingId.value = id;
    try {
      const task = await api.tasks.archive(id);
      replaceTask(task);
      selected.value = task;
      return task;
    } catch (e) {
      error.value = mapTaskError(e, "Не удалось архивировать задачу.");
      throw e;
    } finally {
      mutatingId.value = null;
    }
  }

  function replaceTask(task: Task) {
    items.value = items.value.map((item) => (item.id === task.id ? task : item));
  }

  function applyTaskPatch(patch: Pick<Task, "id" | "status">) {
    items.value = items.value.map((item) =>
      item.id === patch.id ? { ...item, status: patch.status } : item,
    );
    if (selected.value?.id === patch.id) {
      selected.value = { ...selected.value, status: patch.status };
    }
  }

  return {
    items,
    categories,
    selected,
    completion,
    loading,
    mutatingId,
    isMutating,
    error,
    total,
    load,
    loadCategories,
    get,
    create,
    patch,
    complete,
    archive,
  };
});

function mapTaskError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.body?.message || fallback;
  return fallback;
}
