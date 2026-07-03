<script setup lang="ts">
defineProps<{ icon: string }>()
</script>

<template>
  <div class="flex items-center gap-2.5">
    <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-900/30">
      <i :class="`pi ${icon} text-[10px] text-blue-400`" />
    </div>
    <slot />
  </div>
</template>
