<script setup lang="ts">

const props = defineProps<{
  modelValue?: string | number
  type?: string
  placeholder?: string
  error?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

defineOptions({ inheritAttrs: false })

function handleInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:modelValue', props.type === 'number' ? (val === '' ? 0 : Number(val)) : val)
}
</script>

<template>
  <input
    v-bind="$attrs"
    :value="modelValue"
    :type="type ?? 'text'"
    :placeholder="placeholder"
    class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
    :class="error ? 'border-red-500/60 bg-red-500/5' : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'"
    @input="handleInput"
  />
</template>
