<script setup lang="ts">
import { ConfirmDialog, Menubar, Toast } from "primevue";
import { useRouter } from "vue-router";
import {
  GROUPS_ICON,
  GROUPS_LABEL,
  GROUPS_ROUTE,
} from "./composables/constants";
import { onMounted, ref } from "vue";
import { useGlobalStore } from "./stores/GlobalStore";

const router = useRouter();
const { setData } = useGlobalStore();

const items = ref([
  {
    label: GROUPS_LABEL,
    icon: GROUPS_ICON,
    command: () => router.push(GROUPS_ROUTE),
  },
]);

onMounted(() => {
  setData();
});
</script>

<template>
  <div class="lg:p-4">
    <div class="flex justify-center items-center">
      <h1 class="mb-4 flex items-center gap-3 text-3xl font-semibold">
        ბანაკი "ვაზი"
      </h1>
    </div>

    <Menubar :model="items" />

    <Toast
      class="right-0 left-0 mx-auto w-full max-w-[100vw] px-2 [&_.p-toast-message]:max-w-full [&_.p-toast-message]:rounded-xl [&_.p-toast-message]:wrap-break-word [&_.p-toast-message]:whitespace-normal"
    />
    <ConfirmDialog class="mx-2" />
    <router-view />
  </div>
</template>
