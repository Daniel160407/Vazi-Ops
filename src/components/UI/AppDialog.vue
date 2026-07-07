<script setup lang="ts">
import AppButton from "./AppButton.vue";

defineProps<{ visible: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-[250ms] ease-in-out"
      leave-active-class="transition-opacity duration-200 ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        @click="emit('close')"
      />
    </Transition>

    <Transition
      enter-active-class="transition-[opacity,transform] duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      leave-active-class="transition-[opacity,transform] duration-200 ease-in"
      enter-from-class="opacity-0 scale-95 translate-y-2"
      leave-to-class="opacity-0 scale-95 translate-y-2"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-6"
        @click="emit('close')"
      >
        <div
          class="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl border border-blue-900/40 bg-[#07101e] p-5 shadow-[0_24px_80px_0_rgba(0,10,40,0.9)]"
          @click.stop
        >
          <div class="mb-5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="h-4 w-[3px] rounded-full bg-blue-500" />
              <span class="text-sm font-bold text-slate-200">{{ title }}</span>
            </div>
            <AppButton variant="icon-close" icon="pi-times" @click="emit('close')" />
          </div>

          <slot />

          <div class="h-2" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
