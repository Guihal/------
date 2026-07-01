<script setup lang="ts">
import { Sparkles, X } from "lucide-vue-next";
import type { CompletionPayload } from "~~/api";

const props = defineProps<{ payload: CompletionPayload | null }>();
const visual = useVisualStore();
const open = ref(false);

const hasHeavyReward = computed(() => {
  const p = props.payload;
  return !!p?.is_fresh_completion_event && (!!p.task_drop.item || p.level_rewards.length > 0);
});
const compact = computed(() => {
  const p = props.payload;
  if (!p?.is_fresh_completion_event) return "";
  if (hasHeavyReward.value) return "";
  const drop = p.task_drop.item ? "Награда получена." : "Предмет не выпал.";
  return `Задача выполнена. ${rewardXpLine(p)}. ${drop}`;
});

watch(() => props.payload, (payload) => {
  open.value = !!payload && hasHeavyReward.value;
}, { immediate: true });
</script>

<template>
  <p v-if="compact" class="compact" role="status" aria-live="polite">
    {{ compact }}
  </p>
  <Teleport to="body">
    <div v-if="open && payload" class="shade" role="presentation">
      <section class="popup" role="dialog" aria-modal="true" aria-live="polite" aria-label="Награда">
        <button class="close tap" type="button" aria-label="Закрыть награду" @click="open = false">
          <X :size="18" aria-hidden="true" />
        </button>
        <Sparkles class="icon" :size="28" aria-hidden="true" />
        <h2>{{ payload.level_ups.length ? visual.current.level_up_text : "Награда" }}</h2>
        <p class="xp">{{ rewardXpLine(payload) }}</p>
        <ul>
          <li v-if="payload.task_drop.item">
            Предмет за задачу: {{ rewardItemLine(payload.task_drop.item) }}
          </li>
          <li v-for="reward in payload.level_rewards" :key="reward.item.id">
            Уровень {{ reward.level }}: {{ rewardItemLine(reward.item) }}
          </li>
        </ul>
      </section>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.compact { margin: 0; padding: 0.75rem; border: 1px solid var(--stroke); border-radius: var(--radius-md); background: var(--surface); color: var(--text); }
.shade { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; padding: 1rem; background: color-mix(in srgb, var(--bg) 78%, transparent); }
.popup { position: relative; width: min(100%, 22rem); max-height: calc(100dvh - 2rem); overflow: auto; display: grid; gap: 0.7rem; padding: 1.2rem; border: 1px solid var(--magic); border-radius: var(--radius-xl); background: var(--surface); color: var(--text); box-shadow: var(--shadow-soft), 0 0 28px color-mix(in srgb, var(--magic) 35%, transparent); }
.close { position: absolute; top: 0.6rem; right: 0.6rem; display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid var(--stroke); border-radius: var(--radius-md); background: var(--surface-2); color: var(--text); }
.icon { color: var(--magic); filter: drop-shadow(0 0 10px var(--magic)); }
h2, .xp, ul { margin: 0; }
h2 { font-size: 1.35rem; }
.xp { color: var(--xp); font-weight: 900; }
ul { display: grid; gap: 0.45rem; padding-left: 1.1rem; }
</style>
