<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue?: string | number;
  type?: string;
  placeholder?: string;
  error?: boolean;
  variant?: "default" | "table-header" | "table-row-label" | "table-cell";
}>();

const emit = defineEmits<{ "update:modelValue": [value: string | number] }>();

defineOptions({ inheritAttrs: false });

function handleInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  emit(
    "update:modelValue",
    props.type === "number" ? (val === "" ? 0 : Number(val)) : val,
  );
}

const classes = computed(() => {
  const tableBase = "bg-transparent focus:bg-blue-900/10 focus:outline-none";

  switch (props.variant) {
    case "table-header":
      return `${tableBase} min-w-25 flex-1 px-2 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-400 placeholder-slate-700`;
    case "table-row-label":
      return `${tableBase} w-full min-w-32.5 px-3 py-2.5 text-xs font-semibold text-slate-300 placeholder-slate-700`;
    case "table-cell":
      return `${tableBase} w-full min-w-30 px-3 py-2.5 text-sm text-white`;
    case "default":
    default:
  }

  return `w-full rounded-xl border px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
    props.error
      ? "border-red-500/60 bg-red-500/5"
      : "border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60"
  }`;
});
</script>

<template>
  <input
    v-bind="$attrs"
    :value="modelValue"
    :type="type ?? 'text'"
    :placeholder="placeholder"
    :class="classes"
    @input="handleInput"
  />
</template>
