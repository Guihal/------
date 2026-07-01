<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const auth = useAuthStore();
const profile = useProfileStore();
const inventory = useInventoryStore();
const visual = useVisualStore();

async function onLogout() {
  await auth.logout();
  await navigateTo("/login");
}

async function saveName(name: string) {
  await profile.saveName(name).catch(() => {});
}

onMounted(async () => {
  await Promise.allSettled([profile.load(), inventory.load()]);
});
</script>

<template>
  <section class="wrap" :class="`profile-${visual.current.profile_background}`">
    <div class="title">
      <p>Профиль</p>
      <h1>{{ profile.profile?.display_name ?? "Профиль" }}</h1>
    </div>
    <p v-if="profile.loading" class="state" role="status">Профиль загружается…</p>
    <p v-if="profile.error" class="state error" role="alert" aria-live="assertive">
      {{ profile.error }}
    </p>
    <template v-if="profile.profile">
      <ProfileMascot :mascot="profile.mascot" :equipped="inventory.equipped" />
      <ProfileNameForm
        :name="profile.profile.display_name"
        :saving="profile.saving"
        @save="saveName"
      />
      <ProfileProgress
        :progression="profile.profile.progression"
        :stats="profile.profile.stats"
      />
    </template>
    <button class="logout tap" type="button" @click="onLogout">Выйти</button>
  </section>
</template>

<style scoped lang="scss">
.wrap {
  display: grid;
  gap: 1rem;
  padding-top: 0.9rem;
}
.title p, .title h1 { margin: 0; }
.title p { color: var(--muted); }
.title h1 { font-size: 1.55rem; }
.state { margin: 0; padding: 0.85rem; border: 1px solid var(--stroke); border-radius: var(--radius-lg); background: var(--surface); }
.error { color: var(--danger); }
.profile-quiet-grid { --profile-bg: var(--profile-quiet-grid); }
.profile-night-lines { --profile-bg: var(--profile-night-lines); }
.profile-calm-shapes { --profile-bg: var(--profile-calm-shapes); }
.logout {
  justify-self: start;
  min-height: 44px;
  padding: 0 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--stroke);
  background: var(--surface);
  color: var(--text);
}
</style>
