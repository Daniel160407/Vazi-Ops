<script setup lang="ts">
import { ProgressSpinner } from "primevue";
</script>

<template>
  <div class="flex items-center justify-center py-10">
    <ProgressSpinner
      stroke-width="3"
      fill="transparent"
      animation-duration=".5s"
      aria-label="Loading"
      class="loading-spinner h-15! w-15!"
    />
  </div>
</template>

<style scoped>
.loading-spinner :deep(.p-progressspinner-circle) {
  stroke: #3b82f6 !important;
  animation: p-progressspinner-dash 1.5s ease-in-out infinite !important;
}
</style>
