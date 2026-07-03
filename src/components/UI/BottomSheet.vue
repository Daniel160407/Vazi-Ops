<script setup lang="ts">
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
        <!-- drag pill -->
        <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-blue-900/60" />

        <!-- header -->
        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="h-4 w-[3px] rounded-full bg-blue-500" />
            <span class="text-sm font-bold text-slate-200">{{ title }}</span>
          </div>
          <button
            class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-blue-900/30 text-slate-400 hover:bg-blue-900/60 hover:text-white"
            @click="$emit('close')"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </div>

        <!-- content -->
        <slot />

        <div class="h-6" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop-enter-active { transition: opacity 0.25s ease; }
.backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.sheet-enter-active { transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1); }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }
</style>
