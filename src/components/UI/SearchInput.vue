<script setup lang="ts">
defineProps<{ modelValue: string; placeholder?: string }>()
defineEmits<{ "update:modelValue": [value: string] }>()
</script>

<template>
  <div class="relative mb-4">
    <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500" />
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      class="w-full rounded-2xl border border-blue-900/30 bg-[#0d1829] py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
