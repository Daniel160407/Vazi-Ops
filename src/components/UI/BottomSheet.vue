<script setup lang="ts">
import AppButton from "./AppButton.vue";
defineProps<{ visible: boolean; title: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        @click="$emit('close')"
      />
    </Transition>

    <Transition name="sheet">
      <div
        v-if="visible"
        class="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-blue-900/40 bg-[#07101e] p-5"
        style="box-shadow: 0 -8px 40px 0 rgba(0, 10, 40, 0.8)"
        @click.stop
      >
        <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-blue-900/60" />

        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="h-4 w-[3px] rounded-full bg-blue-500" />
            <span class="text-sm font-bold text-slate-200">{{ title }}</span>
          </div>
          <AppButton variant="icon-close" icon="pi-times" @click="$emit('close')" />
        </div>

        <slot />

        <div class="h-6" />
      </div>
    </Transition>
  </Teleport>
</template>
