<script setup lang="ts">
import { ref, watch } from "vue";
import { DARK_TOKENS as t } from "../../../assets/tokens/dark";

export interface ItemFormData {
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  asset_url: string;
  xp_multiplier_min: number;
  xp_multiplier_max: number;
}

const props = defineProps<{
  initial?: Partial<ItemFormData>;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: ItemFormData];
  cancel: [];
}>();

const name = ref("");
const rarity = ref<ItemFormData["rarity"]>("common");
const assetUrl = ref("");
const xpMin = ref(1);
const xpMax = ref(1);
const error = ref("");

watch(() => props.initial, (val) => {
  if (!val) return;
  name.value = val.name ?? "";
  rarity.value = val.rarity ?? "common";
  assetUrl.value = val.asset_url ?? "";
  xpMin.value = val.xp_multiplier_min ?? 1;
  xpMax.value = val.xp_multiplier_max ?? 1;
}, { immediate: true });

function handleSubmit() {
  error.value = "";
  const n = name.value.trim();
  if (!n || n.length > 100) { error.value = "Название обязательно (1-100 символов)"; return; }
  if (xpMin.value < 0 || xpMax.value < 0) { error.value = "Множители XP не могут быть отрицательными"; return; }
  if (xpMin.value > xpMax.value) { error.value = "Минимум не может превышать максимум"; return; }
  emit("submit", {
    name: n,
    rarity: rarity.value,
    asset_url: assetUrl.value.trim(),
    xp_multiplier_min: xpMin.value,
    xp_multiplier_max: xpMax.value,
  });
}
</script>

<template>
  <form class="item-form" @submit.prevent="handleSubmit">
    <div class="field">
      <label for="item-name">Название *</label>
      <input id="item-name" v-model="name" type="text" placeholder="Название предмета" maxlength="100" :disabled="isLoading" />
    </div>
    <div class="field">
      <label for="item-rarity">Редкость</label>
      <select id="item-rarity" v-model="rarity" :disabled="isLoading">
        <option value="common">Обычный</option>
        <option value="rare">Редкий</option>
        <option value="epic">Эпический</option>
        <option value="legendary">Легендарный</option>
      </select>
    </div>
    <div class="field">
      <label for="item-asset">URL ассета</label>
      <input id="item-asset" v-model="assetUrl" type="text" placeholder="https://..." :disabled="isLoading" />
    </div>
    <div class="field-row">
      <div class="field">
        <label for="item-xp-min">Множитель XP (мин)</label>
        <input id="item-xp-min" v-model.number="xpMin" type="number" min="0" step="0.1" :disabled="isLoading" />
      </div>
      <div class="field">
        <label for="item-xp-max">Множитель XP (макс)</label>
        <input id="item-xp-max" v-model.number="xpMax" type="number" min="0" step="0.1" :disabled="isLoading" />
      </div>
    </div>
    <span v-if="error" class="error" role="alert">{{ error }}</span>
    <div class="form-actions">
      <button type="submit" class="btn-primary" :disabled="isLoading">Сохранить</button>
      <button type="button" class="btn-secondary" :disabled="isLoading" @click="emit('cancel')">Отмена</button>
    </div>
  </form>
</template>

<style scoped>
.item-form { background: v-bind("t.color.bgCard"); border: 1px solid v-bind("t.color.borderSubtle"); border-radius: v-bind("t.radius.lg"); padding: v-bind("t.spacing.lg"); color: v-bind("t.color.textPrimary"); }
.field { display: flex; flex-direction: column; gap: v-bind("t.spacing.xs"); margin-bottom: v-bind("t.spacing.lg"); }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: v-bind("t.spacing.md"); }
@media (max-width: 480px) { .field-row { grid-template-columns: 1fr; } .form-actions { flex-direction: column; } .btn-primary, .btn-secondary { width: 100%; } }
label { font-size: v-bind("t.typography.size.sm"); font-weight: v-bind("t.typography.weight.medium"); color: v-bind("t.color.textSecondary"); }
input, select { width: 100%; background: v-bind("t.color.bgOverlay"); border: 1px solid v-bind("t.color.borderSubtle"); border-radius: v-bind("t.radius.md"); padding: v-bind("t.spacing.sm") v-bind("t.spacing.md"); color: v-bind("t.color.textPrimary"); font-size: v-bind("t.typography.size.md"); min-height: 44px; }
input:focus, select:focus { outline: 2px solid v-bind("t.color.accentBlue"); outline-offset: 2px; border-color: v-bind("t.color.accentBlue"); }
input:disabled, select:disabled { opacity: 0.5; cursor: not-allowed; }
.error { font-size: v-bind("t.typography.size.xs"); color: v-bind("t.color.statusError"); margin-bottom: v-bind("t.spacing.md"); display: block; }
.form-actions { display: flex; gap: v-bind("t.spacing.sm"); margin-top: v-bind("t.spacing.lg"); }
.btn-primary, .btn-secondary { min-height: 44px; padding: v-bind("t.spacing.sm") v-bind("t.spacing.lg"); border-radius: v-bind("t.radius.md"); font-size: v-bind("t.typography.size.md"); font-weight: v-bind("t.typography.weight.semibold"); cursor: pointer; flex: 1; transition: all 0.15s ease; }
.btn-primary { background: v-bind("t.color.accentBlue"); color: v-bind("t.color.textInverse"); border: none; }
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: transparent; color: v-bind("t.color.textSecondary"); border: 1px solid v-bind("t.color.borderSubtle"); }
.btn-secondary:hover:not(:disabled) { background: v-bind("t.color.bgOverlay"); color: v-bind("t.color.textPrimary"); }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
