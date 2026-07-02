<script setup lang="ts">
import { ref } from "vue";
import { Toast, ConfirmDialog } from "primevue";
import { useGlobalStore } from "./stores/GlobalStore";
import BottomNav from "./components/BottomNav.vue";
import MoreSheet from "./components/MoreSheet.vue";

const { setData } = useGlobalStore();
setData();

const showMore = ref(false);
</script>

<template>
  <div
    class="font-bpg flex min-h-svh w-full flex-col items-center justify-start bg-[#03060f] text-white"
  >
    <div class="w-full pb-20 lg:max-w-2xl">
      <div class="flex items-center justify-center gap-3 px-4 pt-8 pb-4">
        <h1 class="text-2xl font-semibold tracking-tight">ბანაკი "ვაზი"</h1>
        <img src="./assets/images/logo.png" class="h-10 w-10 object-contain" />
      </div>

      <div class="px-4">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>

    <BottomNav @open-more="showMore = true" />
    <MoreSheet :visible="showMore" @close="showMore = false" />

    <Toast
      class="right-0 left-0 mx-auto w-full max-w-[100vw] px-2 [&_.p-toast-message]:max-w-full [&_.p-toast-message]:rounded-xl [&_.p-toast-message]:wrap-break-word [&_.p-toast-message]:whitespace-normal"
    />
    <ConfirmDialog class="mx-2" />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
