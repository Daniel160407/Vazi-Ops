<script setup lang="ts">
import AppInput from './AppInput.vue'

defineProps<{ modelValue: string; placeholder?: string }>()
defineEmits<{ "update:modelValue": [value: string] }>()
</script>

<template>
  <div class="relative mb-4">
    <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500" />
    <AppInput
      :model-value="modelValue"
      :placeholder="placeholder"
      class="!pl-10 !pr-4 rounded-2xl"
      @update:model-value="$emit('update:modelValue', $event as string)"
    />
  </div>
</template>
