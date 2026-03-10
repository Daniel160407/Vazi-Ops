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
  ADMIN_DAY_SCHEDULE_LABEL,
  ADMIN_DAY_SCHEDULE_ROUTE,
  EVENING_SCHEDULE_LABEL,
  EVENING_SCHEDULE_ICON,
  EVENING_SCHEDULE_ROUTE,
  ADMIN_EVENING_SCHEDULE_LABEL,
  ADMIN_EVENING_SCHEDULE_ROUTE,
  CLUBS_LABEL,
  EVENTS_LABEL,
  EVENTS_ICON,
  EVENTS_ROUTE,
  ADMIN_EVENTS_LABEL,
  ADMIN_EVENTS_ROUTE,
  CLUB_BOOKINGS_ICON,
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
    label: CLUBS_LABEL,
    icon: CLUBS_ICON,
    command: () => router.push(CLUBS_ROUTE),
  },
  {
    label: DAY_SCHEDULE_LABEL,
    icon: DAY_SCHEDULE_ICON,
    command: () => router.push(DAY_SCHEDULE_ROUTE),
  },
  {
    label: EVENING_SCHEDULE_LABEL,
    icon: EVENING_SCHEDULE_ICON,
    command: () => router.push(EVENING_SCHEDULE_ROUTE),
  },
  {
    label: EVENTS_LABEL,
    icon: EVENTS_ICON,
    command: () => router.push(EVENTS_ROUTE),
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
        icon: CLUBS_ICON,
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
        icon: CLUB_BOOKINGS_ICON,
        command: async () => {
          if (!user.value) {
            await signInWithGoogle();
          }

          if (user.value) {
            router.push(ADMIN_CLUB_BOOKINGS_ROUTE);
          }
        },
      },
      {
        label: ADMIN_DAY_SCHEDULE_LABEL,
        icon: DAY_SCHEDULE_ICON,
        command: async () => {
          if (!user.value) {
            await signInWithGoogle();
          }

          if (user.value) {
            router.push(ADMIN_DAY_SCHEDULE_ROUTE);
          }
        },
      },
      {
        label: ADMIN_EVENING_SCHEDULE_LABEL,
        icon: EVENING_SCHEDULE_ICON,
        command: async () => {
          if (!user.value) {
            await signInWithGoogle();
          }

          if (user.value) {
            router.push(ADMIN_EVENING_SCHEDULE_ROUTE);
          }
        },
      },
      {
        label: ADMIN_EVENTS_LABEL,
        icon: EVENTS_ICON,
        command: async () => {
          if (!user.value) {
            await signInWithGoogle();
          }

          if (user.value) {
            router.push(ADMIN_EVENTS_ROUTE);
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
  <div
    class="font-bpg flex min-h-svh w-full flex-col items-center justify-start bg-black p-4 lg:p-10 text-white"
  >
    <div class="flex gap-3 justify-center items-center mb-6">
      <h1 class="text-3xl font-semibold tracking-tight">ბანაკი "ვაზი"</h1>
      <img src="./assets/images/logo.png" class="w-12 h-12 object-contain" />
    </div>

    <div
      class="z-20 w-full rounded-xl bg-[#18181B] p-2 lg:min-w-225 lg:p-4 xl:max-w-300 shadow-2xl"
    >
      <div>
        <Menubar
          :model="items"
          class="mb-4 rounded-none! border-t-0! border-r-0! border-b! border-l-0! border-surface-700!"
        />

        <div class="p-2 min-h-100">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </div>

    <Toast class="right-0 left-0 mx-auto w-full px-2" />
    <ConfirmDialog class="mx-2" />
  </div>
</template>
