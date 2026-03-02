<script setup lang="ts">
import { ConfirmDialog, Menubar, Toast } from "primevue";
import { useRouter } from "vue-router";
import {
  ADMIN_GROUPS_ROUTE,
  ADMIN_CLUBS_ROUTE,
  ADMIN_CLUB_BOOKINGS_ROUTE,
  CLUBS_ROUTE,
  ADMIN_ICON,
  ADMIN_LABEL,
  ADMIN_CLUBS_LABEL,
  ADMIN_CLUB_BOOKINGS_LABEL,
  GROUPS_ICON,
  GROUPS_LABEL,
  GROUPS_ROUTE,
  DAY_SCHEDULE_LABEL,
  CLUBS_ICON,
  DAY_SCHEDULE_ICON,
  DAY_SCHEDULE_ROUTE,
} from "./composables/constants";
import { onMounted, ref } from "vue";
import { useGlobalStore } from "./stores/GlobalStore";
import { useAuth } from "./composables/useAuth";

const router = useRouter();
const { setData } = useGlobalStore();
const { user, signInWithGoogle } = useAuth();

const items = ref([
  {
    label: GROUPS_LABEL,
    icon: GROUPS_ICON,
    command: () => router.push(GROUPS_ROUTE),
  },
  {
    label: "წრეები",
    icon: CLUBS_ICON,
    command: () => router.push(CLUBS_ROUTE),
  },
  {
    label: DAY_SCHEDULE_LABEL,
    icon: DAY_SCHEDULE_ICON,
    command: () => router.push(DAY_SCHEDULE_ROUTE),
  },
  {
    label: ADMIN_LABEL,
    icon: ADMIN_ICON,
    items: [
      {
        label: GROUPS_LABEL,
        icon: GROUPS_ICON,
        command: async () => {
          if (!user.value) {
            await signInWithGoogle();
          }

          if (user.value) {
            router.push(ADMIN_GROUPS_ROUTE);
          }
        },
      },
      {
        label: ADMIN_CLUBS_LABEL,
        icon: "pi pi-users",
        command: async () => {
          if (!user.value) {
            await signInWithGoogle();
          }

          if (user.value) {
            router.push(ADMIN_CLUBS_ROUTE);
          }
        },
      },
      {
        label: ADMIN_CLUB_BOOKINGS_LABEL,
        icon: "pi pi-list",
        command: async () => {
          if (!user.value) {
            await signInWithGoogle();
          }

          if (user.value) {
            router.push(ADMIN_CLUB_BOOKINGS_ROUTE);
          }
        },
      },
    ],
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
