<script setup lang="ts">
import { ref } from "vue";
import { useAppConfirm } from "../../composables/useAppConfirm";
import AppButton from "./AppButton.vue";

const { visible, options, close } = useAppConfirm();

const accepting = ref(false);

const handleAccept = async () => {
  if (!options.value) return;
  accepting.value = true;
  await options.value.accept();
  accepting.value = false;
  close();
};
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
        class="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
        @click="close"
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
        class="fixed inset-0 z-[60] flex items-center justify-center p-6"
        @click="close"
      >
        <div
          class="w-full max-w-sm rounded-3xl border border-blue-900/40 bg-[#07101e] p-6 shadow-[0_24px_80px_0_rgba(0,10,40,0.9)]"
          @click.stop
        >
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <i class="pi pi-exclamation-triangle text-lg text-red-400" />
          </div>

          <p class="mb-1 text-base font-bold text-slate-100">{{ options?.header }}</p>
          <p class="mb-6 text-sm text-slate-400">{{ options?.message }}</p>

          <div class="flex gap-3">
            <AppButton variant="ghost" class="flex-1" @click="close">
              {{ options?.rejectLabel }}
            </AppButton>
            <AppButton variant="danger" class="flex-1" :disabled="accepting" @click="handleAccept">
              <i v-if="accepting" class="pi pi-spin pi-spinner text-xs" />
              {{ options?.acceptLabel }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
