<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    variant?:
      | "primary"
      | "danger"
      | "ghost"
      | "secondary"
      | "fab"
      | "icon-edit"
      | "icon-delete"
      | "icon-close"
      | "filter"
      | "segment"
      | "link"
      | "plain";
    icon?: string;
    disabled?: boolean;
    active?: boolean;
    size?: "sm" | "md";
    rounded?: "xl" | "2xl";
  }>(),
  {
    variant: "primary",
    disabled: false,
    active: false,
    size: "sm",
    rounded: "xl",
  },
);

const classes = computed((): string => {
  const t = "transition-all";
  const c = "cursor-pointer";
  const r = props.rounded === "2xl" ? "rounded-2xl" : "rounded-xl";

  switch (props.variant) {
    case "primary":
      return `${c} ${t} flex items-center justify-center gap-2 ${r} bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50`;

    case "danger":
      return `${c} ${t} flex items-center justify-center gap-2 ${r} border border-red-900/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20`;

    case "ghost":
      return `${c} ${t} flex items-center justify-center gap-2 ${r} border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm font-semibold text-slate-400 hover:text-slate-200`;

    case "secondary":
      return `${c} ${t} flex items-center gap-2 ${r} border border-blue-900/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 disabled:opacity-50`;

    case "fab":
      return `${c} ${t} fixed bottom-24 right-5 z-30 flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/40 hover:scale-105 hover:bg-blue-500 active:scale-95 lg:bottom-8 lg:right-8`;

    case "icon-edit": {
      const sz = props.size === "md" ? "h-8 w-8" : "h-7 w-7";
      return `${c} ${t} flex ${sz} items-center justify-center rounded-lg border border-blue-900/20 bg-blue-900/20 text-slate-500 hover:text-slate-300`;
    }

    case "icon-delete": {
      const sz = props.size === "md" ? "h-8 w-8" : "h-7 w-7";
      return `${c} ${t} flex ${sz} items-center justify-center rounded-lg border border-red-900/20 bg-red-500/5 text-red-500/60 hover:bg-red-500/15 hover:text-red-400`;
    }

    case "icon-close":
      return `${c} flex h-7 w-7 items-center justify-center rounded-full bg-blue-900/30 text-slate-400 transition-colors hover:bg-blue-900/60 hover:text-white`;

    case "filter":
      return props.active
        ? `${c} ${t} shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white`
        : `${c} ${t} shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold border border-blue-900/20 bg-[#0d1829] text-slate-500 hover:text-slate-300`;

    case "segment":
      return props.active
        ? `${c} ${t} flex-1 rounded-lg py-2 text-xs font-semibold bg-blue-600 text-white`
        : `${c} ${t} flex-1 rounded-lg py-2 text-xs font-semibold text-slate-500 hover:text-slate-300`;

    case "link":
      return `${c} ${t} flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300`;

    case "plain":
    default:
      return c;
  }
});

const iconSize = computed((): string => {
  switch (props.variant) {
    case "fab":
      return "text-lg";
    case "icon-edit":
    case "icon-delete":
      return "text-[10px]";
    case "icon-close":
      return "text-xs";
    default:
      return "text-sm";
  }
});
</script>

<template>
  <button :disabled="disabled" :class="classes">
    <i v-if="icon" :class="`pi ${icon} ${iconSize}`" />
    <slot />
  </button>
</template>
