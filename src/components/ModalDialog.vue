<script setup lang="ts">
defineProps<{ open: boolean; title: string; width?: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-mask" @click.self="$emit('close')">
      <section class="modal-card" :style="{ width: width || '640px' }">
        <header class="modal-head">
          <h3>{{ title }}</h3>
          <button class="icon-btn" @click="$emit('close')">×</button>
        </header>
        <div class="modal-body"><slot /></div>
        <footer class="modal-foot"><slot name="footer" /></footer>
      </section>
    </div>
  </Teleport>
</template>
