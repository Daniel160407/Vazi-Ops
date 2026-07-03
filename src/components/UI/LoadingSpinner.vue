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
      class="h-15! w-15!"
    />
  </div>
</template>
