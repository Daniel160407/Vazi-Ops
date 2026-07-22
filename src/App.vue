<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { Toast } from "primevue";
import AppConfirmDialog from "./components/UI/AppConfirmDialog.vue";
import LoadingSpinner from "./components/UI/LoadingSpinner.vue";
import { useGlobalStore } from "./stores/GlobalStore";
import BottomNav from "./components/BottomNav.vue";
import MoreSheet from "./components/MoreSheet.vue";
import SideNav from "./components/SideNav.vue";
import AppHeader from "./components/AppHeader.vue";

const store = useGlobalStore();
const { loading } = storeToRefs(store);
store.setData();

const showMore = ref(false);
</script>

<template>
  <div class="font-bpg flex min-h-svh w-full bg-[#03060f] text-white">
    <SideNav class="hidden lg:flex" />

    <div class="flex flex-1 w-full min-w-0 flex-col items-center lg:ml-56">
      <AppHeader />

      <div class="w-full max-w-2xl px-4 pb-24 lg:px-8 lg:pb-10 lg:pt-10">
        <LoadingSpinner v-if="loading" />
        <router-view v-else v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>

    <BottomNav class="lg:hidden" @open-more="showMore = true" />
    <MoreSheet :visible="showMore" @close="showMore = false" />

    <Toast
      class="right-0 left-0 mx-auto w-full max-w-[100vw] px-2 lg:left-56 [&_.p-toast-message]:max-w-full [&_.p-toast-message]:rounded-xl [&_.p-toast-message]:wrap-break-word [&_.p-toast-message]:whitespace-normal"
    />
    <AppConfirmDialog />
  </div>
</template>
