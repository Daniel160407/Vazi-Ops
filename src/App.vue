<script setup lang="ts">
import { ref } from "vue";
import { Toast, ConfirmDialog } from "primevue";
import { useGlobalStore } from "./stores/GlobalStore";
import BottomNav from "./components/BottomNav.vue";
import MoreSheet from "./components/MoreSheet.vue";
import SideNav from "./components/SideNav.vue";

const { setData } = useGlobalStore();
setData();

const showMore = ref(false);
</script>

<template>
  <div class="font-bpg flex min-h-svh w-full bg-[#03060f] text-white">

    <!-- Desktop sidebar -->
    <SideNav class="hidden lg:flex" />

    <!-- Main content -->
    <div class="flex flex-1 flex-col items-center lg:ml-56">

      <!-- Mobile header -->
      <div class="flex w-full items-center justify-center gap-3 px-4 pt-8 pb-4 lg:hidden">
        <h1 class="text-2xl font-semibold tracking-tight">ბანაკი "ვაზი"</h1>
        <img src="./assets/images/logo.png" class="h-10 w-10 object-contain" />
      </div>

      <!-- Desktop header -->
      <div class="hidden w-full items-center gap-3 px-8 pt-8 pb-4 lg:flex">
        <h1 class="text-xl font-semibold tracking-tight text-slate-200">ბანაკი "ვაზი"</h1>
      </div>

      <div class="w-full max-w-2xl px-4 pb-24 lg:px-8 lg:pb-10">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>

    <!-- Mobile bottom nav + sheet -->
    <BottomNav class="lg:hidden" @open-more="showMore = true" />
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
