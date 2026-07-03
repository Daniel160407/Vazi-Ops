<script setup lang="ts">
import { ref } from "vue";
import AppButton from "./AppButton.vue";

defineProps<{ visible: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();

const sheetEl = ref<HTMLElement | null>(null);
const touchStartY = ref(0);
const dragY = ref(0);

const onTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0]!.clientY;
  dragY.value = 0;
};

const onTouchMove = (e: TouchEvent) => {
  const dy = e.touches[0]!.clientY - touchStartY.value;
  if (dy <= 0 || (sheetEl.value && sheetEl.value.scrollTop > 0)) {
    dragY.value = 0;
    return;
  }
  dragY.value = dy;
  e.preventDefault();
};

const onTouchEnd = () => {
  if (dragY.value > 100) emit("close");
  dragY.value = 0;
};
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="sheet">
      <div
        v-if="visible"
        ref="sheetEl"
        class="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-blue-900/40 bg-[#07101e] p-5"
        :style="{
          boxShadow: '0 -8px 40px 0 rgba(0, 10, 40, 0.8)',
          transform: dragY > 0 ? `translateY(${dragY}px)` : '',
          transition: dragY > 0 ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }"
        @click.stop
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
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
