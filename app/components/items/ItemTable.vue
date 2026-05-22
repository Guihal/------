<script setup lang="ts">
import { DARK_TOKENS as t } from "../../../assets/tokens/dark";

export interface ItemRow {
  id: number;
  name: string;
  rarity: string;
  asset_url: string | null;
}

const props = defineProps<{
  items: readonly ItemRow[];
  loadingId?: number | null;
}>();

const emit = defineEmits<{
  edit: [id: number];
  delete: [id: number];
}>();

function rarityLabel(r: string): string {
  const map: Record<string, string> = {
    common: "Обычный",
    rare: "Редкий",
    epic: "Эпический",
    legendary: "Легендарный",
  };
  return map[r] ?? r;
}

function rarityColor(r: string): string {
  const map: Record<string, string> = {
    common: t.color.textSecondary,
    rare: t.color.accentBlue,
    epic: t.color.accentYellow,
    legendary: t.color.accentOrange,
  };
  return map[r] ?? t.color.textSecondary;
}
</script>

<template>
  <div class="table-wrap">
    <table class="item-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Название</th>
          <th>Редкость</th>
          <th>Ассет</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in props.items" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>
            <span class="rarity-badge" :style="{ color: rarityColor(item.rarity), borderColor: rarityColor(item.rarity) }">
              {{ rarityLabel(item.rarity) }}
            </span>
          </td>
          <td>
            <a v-if="item.asset_url" :href="item.asset_url" target="_blank" class="asset-link">ссылка</a>
            <span v-else class="asset-empty">—</span>
          </td>
          <td>
            <div class="actions">
              <button class="btn-icon" :disabled="props.loadingId === item.id" @click="emit('edit', item.id)">✎</button>
              <button class="btn-icon btn-danger" :disabled="props.loadingId === item.id" @click="emit('delete', item.id)">✕</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap { overflow-x: auto; border: 1px solid v-bind("t.color.borderSubtle"); border-radius: v-bind("t.radius.lg"); }
.item-table { width: 100%; border-collapse: collapse; font-size: v-bind("t.typography.size.md"); color: v-bind("t.color.textPrimary"); }
.item-table th, .item-table td { padding: v-bind("t.spacing.sm") v-bind("t.spacing.md"); text-align: left; border-bottom: 1px solid v-bind("t.color.borderSubtle"); }
.item-table th { font-weight: v-bind("t.typography.weight.semibold"); color: v-bind("t.color.textSecondary"); background: v-bind("t.color.bgOverlay"); font-size: v-bind("t.typography.size.sm"); }
.item-table tbody tr:hover { background: v-bind("t.color.bgOverlay"); }
.rarity-badge { display: inline-block; padding: 2px 8px; border-radius: v-bind("t.radius.full"); border: 1px solid; font-size: v-bind("t.typography.size.xs"); font-weight: v-bind("t.typography.weight.medium"); }
.asset-link { color: v-bind("t.color.accentBlue"); text-decoration: none; }
.asset-link:hover { text-decoration: underline; }
.asset-empty { color: v-bind("t.color.textMuted"); }
.actions { display: flex; gap: v-bind("t.spacing.sm"); }
.btn-icon { min-height: 32px; min-width: 32px; padding: 4px 8px; border-radius: v-bind("t.radius.md"); background: v-bind("t.color.bgOverlay"); border: 1px solid v-bind("t.color.borderSubtle"); color: v-bind("t.color.textSecondary"); cursor: pointer; font-size: v-bind("t.typography.size.sm"); }
.btn-icon:hover:not(:disabled) { background: v-bind("t.color.bgElevated"); color: v-bind("t.color.textPrimary"); }
.btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-danger:hover:not(:disabled) { color: v-bind("t.color.statusError"); border-color: v-bind("t.color.statusError"); }
</style>
