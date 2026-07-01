<script setup lang="ts">
import type { CompletionPayload } from "~~/api";

defineProps<{ payload: CompletionPayload | null }>();
</script>

<template>
  <RewardFeedback :payload="payload" />
</template>
