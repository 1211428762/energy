<script setup lang="ts">
defineProps<{ label: string; value: string; hint: string; tone?: 'green' | 'orange' | 'red' | 'blue' }>()
</script>

<template>
  <section class="kpi-card" :class="tone">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <small>{{ hint }}</small>
  </section>
</template>
