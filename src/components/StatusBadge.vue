<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <span class="status-badge" :data-status="text">{{ text }}</span>
</template>
