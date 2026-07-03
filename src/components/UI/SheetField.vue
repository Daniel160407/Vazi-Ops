<script setup lang="ts">
defineProps<{ label: string; required?: boolean; error?: string }>()
</script>

<template>
  <div>
    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
      {{ label }}<span v-if="required" class="text-red-500"> *</span>
    </label>
    <slot />
    <p v-if="error" class="mt-1 text-xs text-red-400">{{ error }}</p>
  </div>
</template>
