<script setup lang="ts">
import { ref } from "vue";
import { Toast, ConfirmDialog } from "primevue";
import { useGlobalStore } from "./stores/GlobalStore";
import BottomNav from "./components/BottomNav.vue";
import MoreSheet from "./components/MoreSheet.vue";
import SideNav from "./components/SideNav.vue";
import AppHeader from "./components/AppHeader.vue";

const { setData } = useGlobalStore();
setData();

const showMore = ref(false);
</script>

<template>
  <div class="font-bpg flex min-h-svh w-full bg-[#03060f] text-white">
    <SideNav class="hidden lg:flex" />

    <div class="flex flex-1 w-full min-w-0 flex-col items-center lg:ml-56">
      <AppHeader />

      <div class="w-full max-w-2xl px-4 pb-24 lg:px-8 lg:pb-10">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>

    <BottomNav class="lg:hidden" @open-more="showMore = true" />
    <MoreSheet :visible="showMore" @close="showMore = false" />

    <Toast
      class="right-0 left-0 mx-auto w-full max-w-[100vw] px-2 [&_.p-toast-message]:max-w-full [&_.p-toast-message]:rounded-xl [&_.p-toast-message]:wrap-break-word [&_.p-toast-message]:whitespace-normal"
    />
    <ConfirmDialog class="mx-2" />
  </div>
</template>
