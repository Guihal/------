<template>
  <form @submit.prevent="submit">
    <div class="field">
      <label>Name *</label>
      <input v-model="form.name" required maxlength="100">
    </div>
    <div class="field">
      <label>Description</label>
      <textarea v-model="form.description" maxlength="2000" rows="4" />
    </div>
    <div class="field">
      <label>Rarity</label>
      <select v-model="form.rarity">
        <option v-for="r in rarities" :key="r" :value="r">{{ r }}</option>
      </select>
    </div>
    <div class="field">
      <label>Slots</label>
      <input v-model.number="form.slots" type="number" min="1">
    </div>
    <div class="field">
      <label>Active</label>
      <input v-model="form.active" type="checkbox">
    </div>
    <div class="field">
      <label>Asset</label>
      <input ref="fileInput" type="file" accept="image/*" @change="onFileChange">
      <img v-if="previewUrl" :src="previewUrl" class="preview" alt="Preview">
    </div>
    <button type="submit" class="btn">{{ item ? 'Update' : 'Create' }}</button>
    <NuxtLink to="/items" class="btn secondary">Cancel</NuxtLink>
  </form>
</template>

<script setup lang="ts">
const rarities = ['common', 'rare', 'epic', 'legendary'] as const

interface Item {
  id: number
  name: string
  description: string | null
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  slots: number
  asset_url: string | null
  active: boolean
}

const props = defineProps<{ item?: Item }>()
const emit = defineEmits<{ submit: [FormData] }>()

const form = reactive({
  name: props.item?.name ?? '',
  description: props.item?.description ?? '',
  rarity: props.item?.rarity ?? 'common',
  slots: props.item?.slots ?? 1,
  active: props.item?.active ?? true,
})

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref(props.item?.asset_url ?? '')

function onFileChange() {
  const file = fileInput.value?.files?.[0]
  if (file) {
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl.value)
    }
    previewUrl.value = URL.createObjectURL(file)
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

function submit() {
  const body = new FormData()
  body.append('name', form.name)
  if (form.description) body.append('description', form.description)
  body.append('rarity', form.rarity)
  body.append('slots', String(form.slots))
  body.append('active', String(form.active))
  const file = fileInput.value?.files?.[0]
  if (file) body.append('asset', file)
  emit('submit', body)
}
</script>

<style scoped>
.field { margin-bottom: 1rem; }
label { display: block; font-weight: bold; margin-bottom: 0.25rem; }
input, select, textarea { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; width: 100%; max-width: 400px; box-sizing: border-box; }
input[type="checkbox"] { width: auto; }
.preview { width: 100px; height: 100px; object-fit: cover; margin-top: 0.5rem; border-radius: 4px; }
.btn { padding: 0.5rem 1rem; background: #1a1a2e; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem; text-decoration: none; display: inline-block; }
.btn.secondary { background: #888; }
</style>
